"use client";

import * as React from "react";
import { formatCompactCurrency } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { useAaveApys } from "@/hooks/useAaveApys";

const EDICT_PROXY_VAULT_ADDRESS = "0xE9E6792401d53009d6768ba0A03b5Db6a71032D4";
const vaultAbi = parseAbi(["function totalDeposits() external view returns (uint256)"]);

export function VaultOverview() {
  const activeTab = useStore((state) => state.activeTab);
  const mockGlobalTvl = useStore((state) => state.pools[activeTab].globalTvl);
  const { apys, loading: apysLoading } = useAaveApys();
  
  const { data: totalDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
    query: {
      enabled: activeTab === "USDC",
    },
  });

  const globalTvl = activeTab === "USDC" 
    ? (totalDepositsData !== undefined ? Number(totalDepositsData) / 10 ** 6 : 0)
    : mockGlobalTvl;

  const deposits = formatCompactCurrency(globalTvl);
  const liquidity = formatCompactCurrency(globalTvl * 0.277); // 27.7% liquidity simulation

  return (
    <div className="w-full animate-fade-up" style={{ animationDelay: "100ms" }}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-4 bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-6 md:p-8 shadow-sm">
        
        {/* Total Deposits */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            Total Deposits
          </div>
          <div className="flex items-baseline tracking-tight font-mono h-9">
            <span className="text-3xl text-foreground/90 font-medium">{deposits.value}</span>
            <span className="text-3xl text-muted-foreground font-medium ml-1">{deposits.suffix}</span>
          </div>
        </div>

        {/* Liquidity */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            Liquidity
          </div>
          <div className="flex items-baseline tracking-tight font-mono h-9">
            <span className="text-3xl text-foreground/90 font-medium">{liquidity.value}</span>
            <span className="text-3xl text-muted-foreground font-medium ml-1">{liquidity.suffix}</span>
          </div>
        </div>

        {/* Net APY */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            Net APY
          </div>
          <div className="flex items-baseline tracking-tight font-mono h-9">
            <span className="text-3xl text-foreground/90 font-medium">
              {apysLoading ? <span className="animate-pulse">--</span> : apys[activeTab as keyof typeof apys]}
            </span>
            <span className="text-3xl text-muted-foreground font-medium ml-1">%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
