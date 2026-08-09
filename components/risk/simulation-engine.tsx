"use client";

import * as React from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEdictRebalance } from "@/hooks/use-edict-rebalance";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";

const BASE_SCAN_URL = "https://sepolia.basescan.org/tx/";
const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi(["function totalDeposits() external view returns (uint256)"]);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function SimulationEngine() {
  const resetProtocols = useStore((state) => state.resetProtocols);
  const addLog = useStore((state) => state.addLog);
  const clearLogs = useStore((state) => state.clearLogs);
  const setSimulationProtocols = useStore((state) => state.setSimulationProtocols);
  const setIdleVaultCapital = useStore((state) => state.setIdleVaultCapital);

  const [isSimulating, setIsSimulating] = React.useState(false);
  const { triggerFlightToSafety } = useEdictRebalance();

  const { address } = useAccount();
  const isConnected = !!address;

  // Pull real on-chain TVL for USDC vault
  const { data: onChainTvl } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
    query: { enabled: true, refetchInterval: 10_000 },
  });

  const injectRandomViolation = async () => {
    setIsSimulating(true);

    const activeTab = useStore.getState().activeTab;
    const pool = useStore.getState().pools[activeTab];

    // Real TVL: on-chain (USDC, scaled from 6 decimals) → store globalTvl → store totalDeposited
    const realTvl =
      activeTab === "USDC" && onChainTvl !== undefined
        ? Number(onChainTvl) / 1e6
        : pool.globalTvl || pool.totalDeposited;

    // ── Phase 1: Violation ────────────────────────────────────────────
    const baseProtocols = pool.simulationProtocols || pool.protocols;
    const violationProtocols = baseProtocols.map((p) =>
      p.id === "aave" || p.id === "aave-v3"
        ? { ...p, status: "violation" as const }
        : p
    );
    setSimulationProtocols(violationProtocols);
    addLog({ level: "action", message: "[Watcher Agent]: CVA Telemetry Check: aUSDC (Aave V3 Pool) — VIOLATION DETECTED" });

    // ── Phase 2: Pre-flight logs ──────────────────────────────────────
    await delay(5000);
    addLog({ level: "action", message: "[Watcher Agent]: Confirmed - aBasSepUSDC CVA Status Revoked" });
    await delay(5000);
    addLog({ level: "action", message: "[PROTOCOL ACTION] Withdrawing aBasSepUSDC -> Redeeming underlying USDC to Vault Reserve" });

    // ── Phase 3: Rebalancing state ────────────────────────────────────
    await delay(5000);
    setSimulationProtocols(
      violationProtocols.map((p) =>
        p.id === "aave" || p.id === "aave-v3"
          ? { ...p, status: "rebalancing" as const }
          : p
      )
    );

    // ── Phase 4: On-chain transaction ─────────────────────────────────
    let txHash: `0x${string}`;
    try {
      addLog({ level: "info", message: "[ON-CHAIN] Requesting wallet signature for rebalance()..." });
      txHash = await triggerFlightToSafety();
      addLog({ level: "info", message: `[ON-CHAIN] Transaction submitted: ${txHash}` });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const message =
        raw.includes("User rejected") || raw.includes("user rejected")
          ? "Wallet signature rejected by user."
          : raw.split("\n")[0].slice(0, 140);
      addLog({ level: "violation", message: `[ON-CHAIN] Failed: ${message}` });
      setSimulationProtocols(violationProtocols);
      setIsSimulating(false);
      toast.error("Transaction Failed", { description: message, duration: 8_000 });
      return;
    }

    // ── Phase 5: Wait for block confirmation ─────────────────────────
    addLog({ level: "info", message: "[ON-CHAIN] Awaiting block confirmation on Base Sepolia..." });
    try {
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    } catch {
      // proceed even if polling times out
    }

    // ── Phase 6: Post-confirmation — move ALL capital to Vault Reserve ─
    // Re-read pool so we get the latest state after the await
    const latestPool = useStore.getState().pools[activeTab];
    const latestTvl =
      activeTab === "USDC" && onChainTvl !== undefined
        ? Number(onChainTvl) / 1e6
        : realTvl;

    // Zero out all protocol allocations, mark aave as exited
    setSimulationProtocols(
      (latestPool.simulationProtocols || latestPool.protocols).map((p) =>
        p.id === "aave" || p.id === "aave-v3"
          ? { ...p, status: "exited" as const, allocation: 0, amount: 0 }
          : p
      )
    );
    // Vault Reserve = entire TVL
    setIdleVaultCapital(latestTvl);

    addLog({
      level: "success",
      message: `Rebalance confirmed. $${latestTvl.toLocaleString()} evacuated Aave V3 → Vault Reserve. Tx: ${txHash}`,
    });

    toast.success("Funds Rebalanced", {
      description: (
        <a
          href={`${BASE_SCAN_URL}${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline opacity-80 hover:opacity-100 transition-opacity text-xs font-mono"
        >
          View on Base Sepolia ↗
        </a>
      ),
      duration: 12_000,
    });

    setIsSimulating(false);
  };

  const handleRestore = () => {
    resetProtocols();
    setIsSimulating(false);
  };

  return (
    <div className="border w-full bg-card border-black/5 dark:border-white/[0.03] shadow-none rounded-[1.5rem] overflow-hidden">
      <div className="px-6 py-5 md:px-8 md:py-6 border-b border-black/5 dark:border-white/[0.03]">
        <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
          Stress Test Engine
        </div>
      </div>
      <div className="px-6 py-5 md:px-8 md:py-6 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
          Simulate a Cleanverse Verified Assets (CVA) compliance failure to test the autonomous
          evacuation protocol.
        </p>

        <div title={!isConnected ? "Connect your wallet to simulate CVA failure" : undefined}>
          <Button
            disabled={isSimulating || !isConnected}
            onClick={injectRandomViolation}
            className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full h-12 font-medium shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSimulating ? "Simulating Failure..." : "Simulate CVA Failure"}
          </Button>
        </div>

        <Button
          onClick={handleRestore}
          variant="outline"
          className="w-full rounded-full h-12 font-medium transition-all active:scale-[0.98]"
        >
          Restore Network State
        </Button>

        <Button onClick={clearLogs} variant="ghost" className="w-full text-xs text-muted-foreground mt-4">
          Clear Telemetry Logs
        </Button>
      </div>
    </div>
  );
}
