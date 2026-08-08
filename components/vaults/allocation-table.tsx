"use client";

import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useReadContract } from "wagmi";
import { parseAbi } from "viem";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi([
  "function totalDeposits() external view returns (uint256)",
]);

interface AllocationTableProps {
  isActive: boolean;
}

import { AaveIcon, MorphoIcon, MoonwellIcon } from "./protocol-icons";

const PROTOCOL_META: Record<string, { displayName: string; network: string; icon: React.ElementType }> = {
  aave: { displayName: "Aave V3", network: "Base", icon: AaveIcon },
  morpho: { displayName: "Morpho Blue", network: "Base", icon: MorphoIcon },
  moonwell: { displayName: "Moonwell", network: "Base", icon: MoonwellIcon },
  "aave-v3": { displayName: "Aave V3", network: "Base", icon: AaveIcon },
  "morpho-blue": { displayName: "Morpho Blue", network: "Base", icon: MorphoIcon },
};

function StatusBadge({ status }: { status: string }) {
  const isCompliant = status === "compliant" || status === "rebalancing" || status === "exited";
  return (
    <Badge
      variant="outline"
      className={`text-[9px] font-bold tracking-[0.13em] uppercase px-2 py-0.5 h-auto rounded-full ${
        isCompliant
          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
          : "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5"
      }`}
    >
      {isCompliant ? (
        <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />
      ) : (
        <AlertTriangle className="w-2.5 h-2.5 mr-1 inline" />
      )}
      {status === "compliant"
        ? "COMPLIANT"
        : status === "violation"
        ? "VIOLATION"
        : status.toUpperCase()}
    </Badge>
  );
}

/** Monochrome square icon for Vault Reserve — matches the protocol-health-matrix style */
function VaultReserveIcon({ className }: { className?: string }) {
  return (
    <div
      className={`w-3.5 h-3.5 rounded-[2px] bg-foreground ${className ?? ""}`}
      style={{ flexShrink: 0 }}
    />
  );
}

export function AllocationTable({ isActive }: AllocationTableProps) {
  const activeTab = useStore((s) => s.activeTab);
  const protocols = useStore((s) => s.pools[activeTab].protocols);
  const simulationProtocols = useStore((s) => s.pools[activeTab].simulationProtocols);
  const idleVaultCapital = useStore((s) => s.pools[activeTab].idleVaultCapital);
  const storeGlobalTvl = useStore((s) => s.pools[activeTab].globalTvl);

  const { data: totalDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
    query: { enabled: activeTab === "USDC" },
  });

  const globalTvl =
    activeTab === "USDC"
      ? totalDepositsData !== undefined
        ? Number(totalDepositsData) / 1e6
        : 0
      : storeGlobalTvl;

  // During simulation use simulationProtocols, otherwise fall back to protocols
  const displayProtocols = simulationProtocols ?? protocols;

  // Total for allocation bar denominator
  const totalForBars = globalTvl + idleVaultCapital;

  return (
    <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-7 py-5 border-b border-black/5 dark:border-white/[0.03] flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground tracking-tight">Allocation</h2>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 px-7 py-3 border-b border-black/5 dark:border-white/[0.03] bg-black/[0.015] dark:bg-white/[0.015]">
        <div className="col-span-5 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">Protocol</div>
        <div className="col-span-4 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">Exposure</div>
        <div className="col-span-3 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase text-right">Holdings</div>
      </div>

      {/* Protocol rows */}
      {displayProtocols.map((protocol) => {
        const meta = PROTOCOL_META[protocol.id] ?? { displayName: protocol.name, network: "Base" };
        const holdings = globalTvl > 0 ? globalTvl * (protocol.allocation / 100) : 0;
        const barPct = totalForBars > 0 ? (holdings / totalForBars) * 100 : protocol.allocation;

        return (
          <div
            key={protocol.id}
            className="grid grid-cols-12 gap-2 items-center px-7 py-4 border-b border-black/5 dark:border-white/[0.03] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
          >
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-center text-foreground/70">
                {meta.icon && <meta.icon className="w-3.5 h-3.5" />}
              </div>
              <div className="text-sm font-medium text-foreground/90">{meta.displayName}</div>
            </div>

            <div className="col-span-4 flex items-center gap-2">
              <div className="group relative flex-grow flex items-center h-4 cursor-pointer">
                <div className="w-full h-[3px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                  <Progress value={barPct} className="h-full bg-transparent" indicatorClassName="bg-foreground/70" />
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-foreground text-background text-[10px] font-mono px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
                  {barPct.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="col-span-3 text-right">
              <span className="text-[13px] font-mono font-medium text-foreground/90">
                {isActive
                  ? `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(holdings)} ${activeTab}`
                  : "--"}
              </span>
            </div>
          </div>
        );
      })}

      {/* Vault Reserve row — always visible, auto-tracks idleVaultCapital */}
      {(() => {
        const vrPct = totalForBars > 0 ? (idleVaultCapital / totalForBars) * 100 : 0;
        return (
          <div className="grid grid-cols-12 gap-2 items-center px-7 py-4 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
            <div className="col-span-5 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-center">
                <VaultReserveIcon />
              </div>
              <div className="text-sm font-medium text-foreground/90">Vault Reserve</div>
            </div>

            <div className="col-span-4 flex items-center gap-2">
              <div className="group relative flex-grow flex items-center h-4 cursor-pointer">
                <div className="w-full h-[3px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                  <Progress value={vrPct} className="h-full bg-transparent" indicatorClassName="bg-foreground" />
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-foreground text-background text-[10px] font-mono px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
                  {vrPct.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="col-span-3 text-right">
              <span className="text-[13px] font-mono font-medium text-foreground/90">
                {isActive
                  ? `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(idleVaultCapital)} ${activeTab}`
                  : "--"}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
