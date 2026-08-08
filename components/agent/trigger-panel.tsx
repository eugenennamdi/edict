"use client";

import { useStore } from "@/lib/store";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TriggerPanel() {
  const activeTab = useStore((state) => state.activeTab);
  const protocols = useStore((state) => state.pools[activeTab].protocols);
  const triggerViolation = useStore((state) => state.triggerViolation);
  const resetProtocols = useStore((state) => state.resetProtocols);
  const setAgentSpeed = useStore((state) => state.setAgentSpeed);
  const clearLogs = useStore((state) => state.clearLogs);

  const injectRandomViolation = () => {
    const compliant = protocols.filter(p => p.status === "compliant");
    if (compliant.length > 0) {
      const target = compliant[Math.floor(Math.random() * compliant.length)];
      triggerViolation(target.id);
    }
  };

  return (
    <Card className="w-full bg-card border-black/5 dark:border-white/[0.03] shadow-xl rounded-[1.5rem] overflow-hidden">
      <CardHeader className="p-6 md:p-8 border-b border-black/5 dark:border-white/[0.03]">
        <div className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
          Agent Controls
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col gap-4">
        <Button onClick={injectRandomViolation} className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full h-12 font-medium">
          Simulate CVA Failure
        </Button>
        <Button onClick={resetProtocols} variant="outline" className="w-full rounded-full h-12 font-medium">
          Restore Network State
        </Button>
        
        <div className="flex gap-4 mt-2">
          <Button onClick={() => setAgentSpeed(500)} variant="outline" className="flex-1 rounded-full text-xs font-mono">
            0.5s Tick
          </Button>
          <Button onClick={() => setAgentSpeed(2000)} variant="outline" className="flex-1 rounded-full text-xs font-mono">
            2.0s Tick
          </Button>
        </div>
        
        <Button onClick={clearLogs} variant="ghost" className="w-full text-xs text-muted-foreground mt-2">
          Clear Telemetry Logs
        </Button>
      </CardContent>
    </Card>
  );
}
