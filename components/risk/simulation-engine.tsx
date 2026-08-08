"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, Address } from "viem";

const EDICT_PROXY_VAULT_ADDRESS = "0xe66053a01233A5a1c7b13f1f8d28B6C529A74265";
const vaultAbi = parseAbi([
  "function rebalance(address failingProtocol, address[] safeProtocols) external"
]);

export function SimulationEngine() {
  const triggerViolation = useStore((state) => state.triggerViolation);
  const resetProtocols = useStore((state) => state.resetProtocols);
  const addLog = useStore((state) => state.addLog);
  const clearLogs = useStore((state) => state.clearLogs);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [simulatedTarget, setSimulatedTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isConfirmed && hash) {
      if (simulatedTarget) {
        triggerViolation(simulatedTarget);
      }
      addLog({
        level: "success",
        message: `On-chain rebalance confirmed. TX Hash: ${hash}`,
      });
      setSimulatedTarget(null);
    }
  }, [isConfirmed, hash, simulatedTarget, addLog, triggerViolation]);

  const injectRandomViolation = () => {
    const activeTab = useStore.getState().activeTab;
    if (useStore.getState().pools[activeTab].totalDeposited === 0) {
      useStore.getState().deposit(10000000);
    }
    
    setTimeout(() => {
      const activeTabLater = useStore.getState().activeTab;
      const currentProtocols = useStore.getState().pools[activeTabLater].protocols;
      const compliant = currentProtocols.filter(p => p.status === "compliant");
      if (compliant.length > 0) {
        const target = compliant[Math.floor(Math.random() * compliant.length)];
        setSimulatedTarget(target.id);

        // Define mock addresses based on our contract deploy script for testing
        const failingProtocolAddr: Address = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
        const safeProtocolsAddrs: Address[] = ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"];

        writeContract({
          address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
          abi: vaultAbi,
          functionName: "rebalance",
          args: [failingProtocolAddr, safeProtocolsAddrs],
        });
      }
    }, 50);
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
          Simulate a Cleanverse Verified Assets (CVA) compliance failure to test the autonomous evacuation protocol.
        </p>
        <Button disabled={isPending || isConfirming} onClick={injectRandomViolation} className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full h-12 font-medium shadow-sm transition-all active:scale-[0.98]">
          {isPending || isConfirming ? "Processing Transaction..." : "Simulate CVA Failure"}
        </Button>
        <Button onClick={resetProtocols} variant="outline" className="w-full rounded-full h-12 font-medium transition-all active:scale-[0.98]">
          Restore Network State
        </Button>
        
        <Button onClick={clearLogs} variant="ghost" className="w-full text-xs text-muted-foreground mt-4">
          Clear Telemetry Logs
        </Button>
      </div>
    </div>
  );
}
