"use client";

import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AllocationTableProps {
  isActive: boolean;
}

/** Maps existing store protocol ids to display names used in the vault detail */
const PROTOCOL_META: Record<string, { displayName: string; network: string }> = {
  aave: { displayName: "Aave V3", network: "Base" },
  morpho: { displayName: "Morpho Blue", network: "Base" },
  moonwell: { displayName: "Moonwell", network: "Base" },
  // fallback — store might use different ids
  "aave-v3": { displayName: "Aave V3", network: "Base" },
  "morpho-blue": { displayName: "Morpho Blue", network: "Base" },
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

export function AllocationTable({ isActive }: AllocationTableProps) {
  const activeTab = useStore((s) => s.activeTab);
  const protocols = useStore((s) => s.pools[activeTab].protocols);
  const globalTvl = useStore((s) => s.pools[activeTab].globalTvl);

  return (
    <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-7 py-5 border-b border-black/5 dark:border-white/[0.03] flex items-center justify-between">
        <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
          Allocation &amp; Exposure
        </div>
        <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          CVA Monitored
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 gap-2 px-7 py-3 border-b border-black/5 dark:border-white/[0.03] bg-black/[0.015] dark:bg-white/[0.015]">
        <div className="col-span-4 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">Protocol</div>
        <div className="col-span-3 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">Exposure</div>
        <div className="col-span-3 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase text-right">Holdings</div>
        <div className="col-span-2 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase text-right">CVA</div>
      </div>

      {/* Rows */}
      {protocols.map((protocol) => {
        const meta = PROTOCOL_META[protocol.id] ?? {
          displayName: protocol.name,
          network: "Base",
        };
        const holdings = globalTvl > 0 ? globalTvl * (protocol.allocation / 100) : 0;

        return (
          <div
            key={protocol.id}
            className="grid grid-cols-12 gap-2 items-center px-7 py-4 border-b border-black/5 dark:border-white/[0.03] last:border-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
          >
            {/* Protocol name */}
            <div className="col-span-4 flex flex-col gap-0.5">
              <div className="text-sm font-medium text-foreground/90">
                {meta.displayName}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {meta.network}
              </div>
            </div>

            {/* Exposure bar */}
            <div className="col-span-3 flex items-center gap-2">
              <div className="flex-grow h-[3px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
                <Progress
                  value={protocol.allocation}
                  className="h-full bg-transparent"
                  indicatorClassName="bg-foreground/70"
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                {protocol.allocation.toFixed(1)}%
              </span>
            </div>

            {/* Holdings */}
            <div className="col-span-3 text-right">
              <span className="text-[13px] font-mono font-medium text-foreground/90">
                {isActive ? formatCurrency(holdings) : "--"}
              </span>
            </div>

            {/* CVA status */}
            <div className="col-span-2 flex justify-end">
              <StatusBadge status={protocol.status} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
