"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ProtocolAllocation, VaultReserveRow } from "./protocol-allocation";
import { useStore } from "@/lib/store";

export function ProtocolGrid() {
  const activeTab = useStore((state) => state.activeTab);
  const globalTvl = useStore((state) => state.pools[activeTab].globalTvl);
  const protocols = useStore((state) => state.pools[activeTab].protocols);
  const simulationProtocols = useStore((state) => state.pools[activeTab].simulationProtocols);
  const idleVaultCapital = useStore((state) => state.pools[activeTab].idleVaultCapital);

  const displayProtocols = simulationProtocols ?? protocols;
  const totalWithReserve = Math.max(globalTvl, idleVaultCapital);

  return (
    <Card className="w-full bg-card border-black/5 dark:border-white/[0.03] shadow-xl rounded-[1.5rem] overflow-hidden">
      <CardHeader className="pt-6 pb-5 px-6 md:pt-8 md:pb-6 md:px-8 border-b border-black/5 dark:border-white/[0.03] flex flex-row items-center justify-between" style={{ paddingBottom: "1.5rem" }}>
        <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium">
          Fund Allocation
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/[0.03]">
          {displayProtocols.map((protocol) => {
            const isRebalancing = displayProtocols.some(p => p.status === "violation" || p.status === "rebalancing");
            const hasExited = displayProtocols.some(p => p.status === "exited");
            const systemState = isRebalancing ? "rebalancing" : hasExited ? "settled" : "initial";
            return (
              <ProtocolAllocation
                key={protocol.id}
                protocol={protocol}
                totalValue={globalTvl}
                totalWithReserve={totalWithReserve}
                systemState={systemState}
              />
            );
          })}
          <VaultReserveRow
            idleVaultCapital={idleVaultCapital}
            totalWithReserve={totalWithReserve}
          />
        </div>
      </CardContent>
    </Card>
  );
}
