import { useStore } from "./store";
import { LOG_TEMPLATES } from "./constants";
import { formatCurrency } from "./utils";

let intervalId: NodeJS.Timeout | null = null;

async function pollCva(addLog: (entry: { level: "info" | "violation"; message: string }) => void) {
  try {
    const response = await fetch("/api/cleanverse/cva", { method: "POST" });
    const result = await response.json();
    const compliant = result.compliant === true;

    addLog({
      level: compliant ? "info" : "violation",
      message: `[Watcher Agent]: CVA check ${compliant ? "passed" : "failed"} | ${result.message} | code: ${result.code} | timestamp: ${result.timestamp}`,
    });
  } catch (error) {
    addLog({
      level: "violation",
      message: `[Watcher Agent]: CVA check failed | ${error instanceof Error ? error.message : "Request error"}`,
    });
  }
}

export function startAgent() {
  if (intervalId) return;

  const tick = () => {
    const state = useStore.getState();
    const activeTab = state.activeTab;
    const activePool = state.pools[activeTab];
    const { addLog, setProtocols, setAttestation } = state;
    const protocols = activePool.protocols;
    const totalDeposited = activePool.totalDeposited;

    // We process violations first
    const violationProtocol = protocols.find(p => p.status === "violation");
    
    if (violationProtocol) {
      addLog({ level: "violation", message: LOG_TEMPLATES.violation(violationProtocol.name) });
      
      const withdrawnAmount = violationProtocol.amount;
      addLog({ level: "action", message: `Withdrawing ${formatCurrency(withdrawnAmount)} from ${violationProtocol.name}` });

      const compliantProtocols = protocols.filter(p => p.status === "compliant");
      
      // If there are no compliant protocols left, we can't rebalance
      if (compliantProtocols.length === 0) {
        addLog({ level: "violation", message: "CRITICAL: No compliant protocols remaining for rebalance." });
        
        // Exclude the violating protocol
        setProtocols(protocols.map(p => 
          p.status === "violation" 
            ? { ...p, status: "rebalancing" as const, amount: 0, allocation: 0 } 
            : p
        ));
        return;
      }

      const depositPerProtocol = withdrawnAmount / compliantProtocols.length;
      const deposited: { amount: number, protocol: string }[] = [];
      
      compliantProtocols.forEach(p => {
        addLog({ level: "action", message: `Depositing ${formatCurrency(depositPerProtocol)} → ${p.name}` });
        deposited.push({ amount: depositPerProtocol, protocol: p.name });
      });

      // Update store
      const newProtocols = protocols.map(p => {
        if (p.status === "violation") {
          return { ...p, status: "rebalancing" as const, amount: 0, allocation: 0 };
        }
        if (p.status === "compliant") {
          const newAmount = p.amount + depositPerProtocol;
          return { ...p, amount: newAmount, allocation: totalDeposited > 0 ? (newAmount / totalDeposited) * 100 : 0 };
        }
        return p;
      });

      setProtocols(newProtocols);

      // Transition to exited state after 5 seconds to show the settled state
      setTimeout(() => {
        const currentState = useStore.getState();
        const currentActivePool = currentState.pools[activeTab];
        const updatedProtocols = currentActivePool.protocols.map(p => 
          p.status === "rebalancing" ? { ...p, status: "exited" as const } : p
        );
        currentState.setProtocols(updatedProtocols);
        currentState.addLog({ level: "success", message: `Rebalancing completed. ${violationProtocol.name} fully evacuated.` });
      }, 5000);

      addLog({ level: "success", message: "Rebalance initiated. Attestation issued." });
      
      setAttestation({
        id: "0x" + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6),
        timestamp: new Date(),
        trigger: `CVA Failure — ${violationProtocol.name}`,
        withdrawn: { amount: withdrawnAmount, protocol: violationProtocol.name },
        deposited
      });

      return;
    }

    // Normal compliance tick: record the real Cleanverse response.
    const compliantProtocols = protocols.filter(p => p.status === "compliant");
    if (compliantProtocols.length > 0) {
      void pollCva(addLog);
    }
  };

  const currentSpeed = useStore.getState().agentSpeed;
  intervalId = setInterval(tick, currentSpeed);
  useStore.getState().setIsAgentRunning(true);
}

export function stopAgent() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  useStore.getState().setIsAgentRunning(false);
}
