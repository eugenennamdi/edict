"use client";

import type { Protocol } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { AaveIcon, MorphoIcon, MoonwellIcon } from "@/components/vaults/protocol-icons";

function VaultReserveIcon({ className }: { className?: string }) {
  return <div className={`w-4 h-4 rounded-[2px] bg-foreground ${className ?? ""}`} />;
}

const PROTOCOL_META: Record<string, { displayName: string; icon: React.ElementType }> = {
  aave:          { displayName: "Aave V3",      icon: AaveIcon },
  morpho:        { displayName: "Morpho Blue",  icon: MorphoIcon },
  moonwell:      { displayName: "Moonwell",     icon: MoonwellIcon },
  "aave-v3":     { displayName: "Aave V3",      icon: AaveIcon },
  "morpho-blue": { displayName: "Morpho Blue",  icon: MorphoIcon },
  "vault-reserve": { displayName: "Vault Reserve", icon: VaultReserveIcon },
};

interface Props {
  protocol: Protocol;
  totalValue: number;
  /** idleVaultCapital passed so the bar denominator is correct */
  totalWithReserve?: number;
  systemState?: "initial" | "rebalancing" | "settled";
}

export function ProtocolAllocation({ protocol, totalValue, totalWithReserve, systemState = "initial" }: Props) {
  const amount = totalValue * (protocol.allocation / 100);
  const meta = PROTOCOL_META[protocol.id] ?? { displayName: protocol.name, icon: AaveIcon };
  const Icon = meta.icon;
  const denom = totalWithReserve ?? totalValue;
  const barPct = denom > 0 ? (amount / denom) * 100 : protocol.allocation;

  return (
    <div className="grid grid-cols-12 gap-2 items-center px-7 py-4 border-b border-black/5 dark:border-white/[0.03] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group">
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.05] flex items-center justify-center">
          <Icon className="w-4 h-4 opacity-70" />
        </div>
        <div className="text-sm font-medium text-foreground/90">{meta.displayName}</div>
      </div>

      <div className="col-span-4 flex items-center gap-2">
        <div className="group/progress relative flex-grow flex items-center h-4 cursor-pointer">
          <div className="w-full h-[3px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
            <Progress
              value={barPct}
              className="h-full bg-transparent w-full"
              indicatorClassName="bg-foreground/70"
            />
          </div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 pointer-events-none transition-opacity bg-foreground text-background text-[10px] font-mono px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
            {barPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="col-span-3 text-right">
        <span className="text-[13px] font-mono font-medium text-foreground/90">
          {totalValue > 0
            ? `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} USDC`
            : "--"}
        </span>
      </div>
    </div>
  );
}

/** Standalone Vault Reserve row — rendered separately so amount = idleVaultCapital */
export function VaultReserveRow({
  idleVaultCapital,
  totalWithReserve,
}: {
  idleVaultCapital: number;
  totalWithReserve: number;
}) {
  const barPct = totalWithReserve > 0 ? (idleVaultCapital / totalWithReserve) * 100 : 0;
  return (
    <div className="grid grid-cols-12 gap-2 items-center px-7 py-4 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors group">
      <div className="col-span-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.05] flex items-center justify-center">
          <VaultReserveIcon className="w-4 h-4 opacity-80" />
        </div>
        <div className="text-sm font-medium text-foreground/90">Vault Reserve</div>
      </div>

      <div className="col-span-4 flex items-center gap-2">
        <div className="group/progress relative flex-grow flex items-center h-4 cursor-pointer">
          <div className="w-full h-[3px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
            <Progress value={barPct} className="h-full bg-transparent w-full" indicatorClassName="bg-foreground" />
          </div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/progress:opacity-100 pointer-events-none transition-opacity bg-foreground text-background text-[10px] font-mono px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
            {barPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="col-span-3 text-right">
        <span className="text-[13px] font-mono font-medium text-foreground/90">
          {`${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(idleVaultCapital)} USDC`}
        </span>
      </div>
    </div>
  );
}
