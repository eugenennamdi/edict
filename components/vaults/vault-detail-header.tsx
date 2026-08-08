"use client";

import { useReadContract, useAccount } from "wagmi";
import { parseAbi } from "viem";
import { useAaveApys } from "@/hooks/useAaveApys";
import { useStore } from "@/lib/store";
import { formatCompactCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi([
  "function totalDeposits() external view returns (uint256)"
]);

interface VaultDetailHeaderProps {
  vaultId: string;
  isActive: boolean;
}

export function VaultDetailHeader({ vaultId, isActive }: VaultDetailHeaderProps) {
  const { apys, loading: apysLoading } = useAaveApys();
  const isVerified = useStore((s) => s.isVerified);

  const { address } = useAccount();

  const { data: totalDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
    query: { enabled: isActive },
  });

  const tvl = totalDepositsData !== undefined ? Number(totalDepositsData) / 1e6 : 0;
  const tvlFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(tvl);
  
  const apy = apys["USDC"] ?? "—";

  const metrics = [
    {
      label: "Vault APY",
      value: apysLoading ? (
        <span className="animate-pulse text-muted-foreground">--</span>
      ) : (
        <span>{isActive ? apy : "--"}<span className="text-xl font-medium text-muted-foreground ml-0.5">%</span></span>
      ),
    },
    {
      label: "Total Value Locked (TVL)",
      value: isActive ? (
        <span>{tvlFormatted}</span>
      ) : (
        <span className="text-muted-foreground">--</span>
      ),
    },
  ];

  return (
    <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-7 shadow-sm">
      {/* Title row */}
      <div className="flex flex-col gap-6 mb-7">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">
              {vaultId.toUpperCase()} Earn Vault
            </h1>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2 tracking-wide">
            ERC-4626 · Multi-strategy · Compliant
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-black/5 dark:border-white/[0.04]">
        {metrics.map(({ label, value }) => (
          <div 
            key={label} 
            className="flex flex-col gap-2.5 p-5 sm:p-6 rounded-[1.25rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.04]"
          >
            <div className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase">
              {label}
            </div>
            <div className="text-2xl font-mono font-semibold text-foreground tracking-tight leading-none">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
