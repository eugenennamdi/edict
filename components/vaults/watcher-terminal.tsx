"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { useAgent } from "@/hooks/use-agent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal } from "lucide-react";
import type { LogEntry } from "@/lib/store";

interface WatcherTerminalProps {
  isActive: boolean;
}

const LEVEL_STYLES: Record<LogEntry["level"], string> = {
  info: "text-muted-foreground/70",
  violation: "text-red-500 dark:text-red-400",
  action: "text-amber-500 dark:text-amber-400",
  success: "text-emerald-500 dark:text-emerald-400",
};

const LEVEL_PREFIX: Record<LogEntry["level"], string> = {
  info: "[INFO]",
  violation: "[VIOLATION]",
  action: "[ACTION]",
  success: "[OK]",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function WatcherTerminal({ isActive }: WatcherTerminalProps) {
  useAgent(); // starts the live watcher loop
  const activeTab = useStore((s) => s.activeTab);
  const logs = useStore((s) => s.pools[activeTab].logs);
  const isRunning = useStore((s) => s.isAgentRunning);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to latest entry
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  return (
    <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-7 py-5 border-b border-black/5 dark:border-white/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
          <Terminal className="w-3.5 h-3.5" />
          Watcher Agent — CVA Telemetry
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning && isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
            }`}
          />
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">
            {isRunning && isActive ? "LIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="h-[320px] overflow-y-auto bg-[#050505] dark:bg-[#030303] p-5 font-mono text-[11px] leading-relaxed"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {logs.length === 0 && (
          <div className="text-muted-foreground/30 select-none">
            $ awaiting watcher agent initialization…
          </div>
        )}
        {[...logs].map((log) => (
          <div key={log.id} className="flex gap-3 mb-1">
            <span className="text-muted-foreground/30 shrink-0 select-none">
              {formatTime(log.timestamp)}
            </span>
            <span className={`shrink-0 font-bold ${LEVEL_STYLES[log.level]}`}>
              {LEVEL_PREFIX[log.level]}
            </span>
            <span className="text-muted-foreground/80 break-all">{log.message}</span>
          </div>
        ))}
        {/* Blinking caret */}
        <div className="flex gap-3 mt-1">
          <span className="text-muted-foreground/20 select-none">
            {formatTime(new Date())}
          </span>
          <span className="text-muted-foreground/30 animate-pulse select-none">█</span>
        </div>
      </div>
    </div>
  );
}
