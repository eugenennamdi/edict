"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// Mock CVA Hashes for visual authenticity
const CVA_HASHES: Record<string, string> = {
  "a": "0x7f3...4a9",
  "b": "0x2e1...8b2",
  "c": "0x9c4...1f0",
};

export function ProtocolHealthMatrix() {
  const activeTab = useStore((state) => state.activeTab);
  const protocols = useStore((state) => state.pools[activeTab].protocols);
  const globalTvl = useStore((state) => state.pools[activeTab].globalTvl);

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
            
            return (
              <div key={protocol.id} className="px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                
                {/* Protocol Name & Hash */}
                <div className="flex items-center gap-4 w-full md:w-[25%]">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{protocol.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="font-mono text-[11px] opacity-70">CVA HASH: <span className="text-foreground">{CVA_HASHES[protocol.id]}</span></span>
                    </div>
                  </div>
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
                    <div className="flex items-center text-foreground/70 bg-black/5 dark:bg-white/5 rounded-full p-1.5" title="Secure">
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                    </div>
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
        </div>
      </div>
    </div>
  );
}
