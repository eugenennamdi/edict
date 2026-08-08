import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "compliant" | "violation" | "pending" | "rebalancing";
  animate?: boolean;
}

export function StatusDot({ status, animate = false }: StatusDotProps) {
  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full",
        {
          "bg-compliant": status === "compliant",
          "bg-violation": status === "violation",
          "bg-pending": status === "pending" || status === "rebalancing",
        },
        animate && "animate-pulse-slow"
      )}
    />
  );
}
