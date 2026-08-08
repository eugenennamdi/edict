"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useReadContract } from "wagmi";
import { parseAbi } from "viem";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi([
  "function totalDeposits() external view returns (uint256)"
]);

import { AaveIcon, MorphoIcon, MoonwellIcon } from "@/components/vaults/protocol-icons";

const PROTOCOL_META: Record<string, { displayName: string; icon: React.ElementType }> = {
  aave: { displayName: "Aave V3", icon: AaveIcon },
  morpho: { displayName: "Morpho Blue", icon: MorphoIcon },
  moonwell: { displayName: "Moonwell", icon: MoonwellIcon },
  "aave-v3": { displayName: "Aave V3", icon: AaveIcon },
  "morpho-blue": { displayName: "Morpho Blue", icon: MorphoIcon },
};

export function ProtocolHealthMatrix() {
  const activeTab = useStore((state) => state.activeTab);
  const pool = useStore((state) => state.pools[activeTab]);
  const protocols = pool.simulationProtocols || pool.protocols;
  const storeGlobalTvl = useStore((state) => state.pools[activeTab].globalTvl);
  const idleVaultCapital = useStore((state) => state.pools[activeTab].idleVaultCapital);

  const { data: totalDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
    query: { enabled: activeTab === "USDC" },
  });

  const globalTvl = activeTab === "USDC"
    ? (totalDepositsData !== undefined ? Number(totalDepositsData) / 1e6 : 0)
    : storeGlobalTvl;

  return (
    <div className="border w-full bg-card border-black/5 dark:border-white/[0.03] shadow-none rounded-[1.5rem] overflow-hidden">
      <div className="px-6 py-5 md:px-8 md:py-6 border-b border-black/5 dark:border-white/[0.03] flex flex-row items-center justify-between">
        <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
          Protocol Health Matrix
        </div>
      </div>
      <div className="p-0">
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/[0.03]">
          {protocols.map((protocol) => {
            const isCompliant = protocol.status === "compliant";
            const isViolation = protocol.status === "violation";
            const isRebalancing = protocol.status === "rebalancing";
            const isExited = protocol.status === "exited";
            
            const meta = PROTOCOL_META[protocol.id] ?? {
              displayName: protocol.name,
              icon: AaveIcon, // fallback
            };
            const Icon = meta.icon;
            
            return (
              <div key={protocol.id} className="px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                
                {/* Protocol Name & Icon */}
                <div className="flex items-center gap-4 w-full md:w-[25%]">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.05] flex items-center justify-center">
                    <Icon className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="font-medium text-foreground">{meta.displayName}</div>
                </div>
                
                {/* Allocation */}
                <div className="w-full md:w-[35%] flex flex-col md:items-start gap-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-80">Allocation</div>
                  <div className="font-mono text-sm flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(globalTvl * (protocol.allocation / 100))}</span>
                    <span className="opacity-50 font-normal">({protocol.allocation.toFixed(2)}%)</span>
                  </div>
                </div>

                {/* Last Audited */}
                <div className="w-full md:w-[20%] flex flex-col md:items-start gap-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-80">Last Audited</div>
                  <div className="font-mono text-xs opacity-80">Just now</div>
                </div>
                
                {/* Status Badge */}
                <div className="w-full md:w-[20%] flex md:justify-end">
                  {isCompliant && (
                    <HoverCard>
                      <HoverCardTrigger render={
                        <div className="flex items-center text-foreground/70 bg-black/5 dark:bg-white/5 rounded-full p-1.5 border-none outline-none cursor-default">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                        </div>
                      } />
                      <HoverCardContent align="end" className="flex w-64 flex-col gap-3 p-4 text-left text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-foreground">CVA Compliant</div>
                          <div className="text-foreground/90 leading-relaxed">
                            {activeTab} allocated to this protocol is CVA Compliant.
                          </div>
                        </div>
                        <div>
                          <a
                            href="https://cleanverse.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <span className="text-[10px] tracking-widest font-semibold uppercase text-muted-foreground">Powered by</span>
                            <img src="/cleanverse-logo.png" alt="Cleanverse" className="h-3 object-contain brightness-0 dark:invert" />
                          </a>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  {isExited && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider font-medium bg-black/5 dark:bg-white/5 text-foreground/70 border border-black/10 dark:border-white/10">
                      <X className="w-3 h-3" />
                      EXITED
                    </div>
                  )}
                  {(isRebalancing || isViolation) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider font-medium bg-black/5 dark:bg-white/5 text-foreground/70 border border-black/10 dark:border-white/10">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      REBALANCING
                    </div>
                  )}
                </div>
                
              </div>
            );
          })}

          {/* ── Vault Reserve row ── always visible ── */}
          <div className="px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
            {/* Monochrome bar + name */}
            <div className="flex items-center gap-4 w-full md:w-[25%]">
              <div className="w-8 h-8 rounded-full bg-foreground/10 dark:bg-foreground/10 border border-foreground/20 dark:border-foreground/20 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-sm bg-foreground opacity-80" />
              </div>
              <div className="font-medium text-foreground">Vault Reserve</div>
            </div>

            {/* Allocation */}
            <div className="w-full md:w-[35%] flex flex-col md:items-start gap-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-80">Allocation</div>
              <div className="font-mono text-sm flex items-center gap-2">
                <span className="font-medium">{formatCurrency(idleVaultCapital)}</span>
                <span className="opacity-50 font-normal">
                  ({globalTvl > 0 ? ((idleVaultCapital / globalTvl) * 100).toFixed(2) : "0.00"}%)
                </span>
              </div>
            </div>

            {/* Last Audited */}
            <div className="w-full md:w-[20%] flex flex-col md:items-start gap-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-80">Last Audited</div>
              <div className="font-mono text-xs opacity-80">Just now</div>
            </div>

            {/* Same checkmark HoverCard as compliant protocols */}
            <div className="w-full md:w-[20%] flex md:justify-end">
              <HoverCard>
                <HoverCardTrigger render={
                  <div className="flex items-center text-foreground/70 bg-black/5 dark:bg-white/5 rounded-full p-1.5 border-none outline-none cursor-default">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                } />
                <HoverCardContent align="end" className="flex w-64 flex-col gap-3 p-4 text-left text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold text-foreground">CVA Compliant</div>
                    <div className="text-foreground/90 leading-relaxed">
                      {activeTab} held in Vault Reserve is secured on-chain and CVA Compliant.
                    </div>
                  </div>
                  <div>
                    <a
                      href="https://cleanverse.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <span className="text-[10px] tracking-widest font-semibold uppercase text-muted-foreground">Powered by</span>
                      <img src="/cleanverse-logo.png" alt="Cleanverse" className="h-3 object-contain brightness-0 dark:invert" />
                    </a>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
