"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import type { Protocol } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, X } from "lucide-react";

export function ProtocolAllocation({ protocol, totalValue, systemState = "initial" }: { protocol: Protocol, totalValue: number, systemState?: "initial" | "rebalancing" | "settled" }) {
  const amount = totalValue * (protocol.allocation / 100);
  
  // Determine badge appearance based on global rebalancing state
  let badgeContent = null;
  
  if (systemState === "rebalancing") {
    // Both violation and compliant protocols show neutral rebalancing state
    badgeContent = (
      <Badge 
        variant="outline" 
        className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border h-5 text-foreground/70 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center gap-1.5"
      >
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        REBALANCING
      </Badge>
    );
  } else if (systemState === "settled") {
    // Settled State
    if (protocol.status === 'exited') {
      badgeContent = (
        <Badge 
          variant="outline" 
          className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border h-5 text-foreground/70 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          EXITED
        </Badge>
      );
    } else {
      // Compliant protocols post-rebalance
      badgeContent = (
        <Badge 
          variant="outline" 
          className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border h-5 text-foreground border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.03] flex items-center gap-1"
        >
          <CheckCircle2 className="w-3 h-3" />
          REBALANCED
        </Badge>
      );
    }
  } else {
    // Initial State - everything is secure
    badgeContent = (
      <Badge 
        variant="outline" 
        className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border h-5 text-foreground/70 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center gap-1"
      >
        ACTIVE
      </Badge>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 items-center p-4 md:px-8 md:py-5 border-b border-black/5 dark:border-white/[0.05] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
      
      {/* Protocol Info */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-black/10 dark:border-white/10 bg-gradient-to-br from-black/5 to-black/10 dark:from-white/10 dark:to-white/5 flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-bold text-foreground/70 tracking-tighter uppercase">
            {protocol.name.substring(0, 2)}
          </span>
        </div>
        <div className="font-sans text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
          {protocol.name}
        </div>
      </div>
      
      {/* Allocation Progress */}
      <div className="col-span-4 flex items-center gap-4">
        <div className="flex-grow flex items-center relative h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
          <Progress 
            value={protocol.allocation} 
            className="h-full bg-transparent w-full" 
            indicatorClassName="bg-foreground/80"
          />
        </div>
        <div className="w-12 text-right font-mono text-[11px] font-medium text-muted-foreground">
          {protocol.allocation.toFixed(1)}%
        </div>
      </div>
      
      {/* Value & Badge */}
      <div className="col-span-4 flex items-center justify-end gap-4">
        <div className="text-[13px] font-mono font-medium text-foreground/90 tracking-tight text-right flex-grow">
          {formatCurrency(amount)}
        </div>
        <div className="w-[105px] flex justify-end shrink-0">
          {badgeContent}
        </div>
      </div>
    </div>
  );
}
