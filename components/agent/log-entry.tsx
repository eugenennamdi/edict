"use client";

import { LogEntry as LogEntryType } from "@/lib/store";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function LogEntry({ entry }: { entry: LogEntryType }) {
  const time = entry.timestamp.toLocaleTimeString("en-US", { hour12: false });
  
  let label = "INFO";
  let labelClass = "text-muted-foreground/60";
  
  if (entry.level === "violation") {
    label = "ALERT";
    labelClass = "text-foreground font-bold";
  } else if (entry.level === "action" || entry.level === "success") {
    label = "SYSTEM";
    labelClass = "text-foreground/80";
  }

  return (
    <TableRow className="border-black/5 dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
      <TableCell className="font-mono text-[10px] text-muted-foreground/60 align-top md:align-middle py-3 pl-6 md:pl-8">
        {time}
      </TableCell>
      <TableCell className="align-top md:align-middle py-3">
        <span className={cn("text-[9px] font-mono tracking-widest", labelClass)}>
          {label}
        </span>
      </TableCell>
      <TableCell className="font-mono text-[11px] uppercase tracking-wide text-foreground/80 break-words align-top md:align-middle py-3 pr-6 md:pr-8">
        {entry.message}
      </TableCell>
    </TableRow>
  );
}
