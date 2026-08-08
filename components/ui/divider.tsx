import { cn } from "@/lib/utils";

export function Divider({ className }: { className?: string }) {
  return <div className={cn("divider w-full", className)} />;
}
