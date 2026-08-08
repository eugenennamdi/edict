"use client";

import * as React from "react";
import { formatCompactCurrency } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { useAaveApys } from "@/hooks/useAaveApys";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
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

  const isUsdc = activeTab === "USDC";
  const CAPACITY = 1000000;
  const filledAmount = isUsdc ? globalTvl : CAPACITY;
  const filledPercent = Math.min((filledAmount / CAPACITY) * 100, 100).toFixed(1);
  const availableAmount = Math.max(CAPACITY - filledAmount, 0);

  const availableFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: "compact",
    maximumFractionDigits: 1
  }).format(availableAmount);

  const displayApy = isUsdc 
    ? (apysLoading ? null : apys.USDC) 
    : (activeTab === "ETH" ? "0.24" : "0.08");

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
              {displayApy ?? <span className="animate-pulse">--</span>}
            </span>
            <span className="text-3xl text-muted-foreground font-medium ml-1">%</span>
          </div>
        </div>

      </div>

      {/* Capacity Progress Bar */}
      <div className="mt-6 bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-6 shadow-sm group/progress">
        <div className="flex justify-between items-center mb-3 text-sm font-medium">
          <span className="text-muted-foreground tracking-tight">Vault Capacity</span>
          <span className="text-foreground transition-all duration-300 font-mono">
            <span className="group-hover/progress:hidden">{isUsdc ? `${filledPercent}% Filled` : `100% Filled`}</span>
            <span className="hidden group-hover/progress:inline">{availableFormatted} Available</span>
          </span>
        </div>
        <div className="h-2.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
            style={{ width: isUsdc ? `${filledPercent}%` : `100%` }}
          />
        </div>
      </div>
    </div>
  );
}
