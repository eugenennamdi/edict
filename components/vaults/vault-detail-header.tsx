"use client";

import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { useAaveApys } from "@/hooks/useAaveApys";
import { useStore } from "@/lib/store";
import { formatCompactCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const EDICT_PROXY_VAULT_ADDRESS = "0xE9E6792401d53009d6768ba0A03b5Db6a71032D4";
const vaultAbi = parseAbi(["function totalDeposits() external view returns (uint256)"]);

interface VaultDetailHeaderProps {
  vaultId: string;
  isActive: boolean;
}

export function VaultDetailHeader({ vaultId, isActive }: VaultDetailHeaderProps) {
  const { apys, loading: apysLoading } = useAaveApys();
  const isVerified = useStore((s) => s.isVerified);

  const { data: totalDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
    query: { enabled: isActive },
  });

  const totalDeposits = totalDepositsData !== undefined ? Number(totalDepositsData) / 1e6 : 0;
  const { value, suffix } = formatCompactCurrency(totalDeposits);
  const apy = apys["USDC"] ?? "—";

  const metrics = [
    {
      label: "Vault APY",
      value: apysLoading ? (
        <span className="animate-pulse text-muted-foreground">--</span>
      ) : (
        <span>{isActive ? apy : "--"}<span className="text-2xl text-muted-foreground ml-0.5">%</span></span>
      ),
    },
    {
      label: "Total Deposits",
      value: isActive ? (
        <span>{value}<span className="text-2xl text-muted-foreground ml-0.5">{suffix}</span></span>
      ) : (
        <span className="text-muted-foreground">--</span>
      ),
    },
    {
      label: "My Position",
      value: <span className="text-muted-foreground">--</span>,
    },
  ];

  return (
    <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-7 shadow-sm">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">
            {vaultId.toUpperCase()} Earn Vault
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ERC-4626 · Multi-strategy · Compliant
          </p>
        </div>

        {/* CVI status badge */}
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 w-fit text-[9px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full h-auto ${
            isVerified
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
              : "border-black/10 dark:border-white/10 text-muted-foreground"
          }`}
        >
          {isVerified ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <ShieldCheck className="w-3 h-3" />
          )}
          {isVerified ? "CVI VERIFIED" : "CVI UNVERIFIED"}
        </Badge>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-black/5 dark:border-white/[0.04]">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="text-[10px] font-mono tracking-[0.18em] text-muted-foreground uppercase">
              {label}
            </div>
            <div className="text-3xl font-mono font-medium text-foreground leading-none">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
