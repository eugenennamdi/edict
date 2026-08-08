"use client";

import { useStore } from "@/lib/store";
import { LogEntry } from "./log-entry";
import { useAgent } from "@/hooks/use-agent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Terminal, Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AuditLog() {
  useAgent(); // Initialize agent loop on mount
  const activeTab = useStore((state) => state.activeTab);
  const logs = useStore((state) => state.pools[activeTab].logs);
  const isAgentRunning = useStore((state) => state.isAgentRunning);

  return (
    <div className="border w-full bg-card border-black/5 dark:border-white/[0.03] shadow-none rounded-[1.5rem] overflow-hidden flex flex-col h-full">
      <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/[0.03] flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
          <Terminal className="w-3 h-3" />
          Live System Log
        </div>
      </div>
      
      <ScrollArea className="h-[400px] w-full">
        <Table>
          <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <TableRow className="border-black/5 dark:border-white/[0.03] hover:bg-transparent">
              <TableHead className="w-[100px] text-[9px] font-mono text-muted-foreground/50 tracking-widest uppercase pl-6 md:pl-8">Time</TableHead>
              <TableHead className="w-[120px] text-[9px] font-mono text-muted-foreground/50 tracking-widest uppercase">Type</TableHead>
              <TableHead className="text-[9px] font-mono text-muted-foreground/50 tracking-widest uppercase pr-6 md:pr-8">Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...logs].reverse().map((log) => (
              <LogEntry key={log.id} entry={log} />
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
