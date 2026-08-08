"use client";

import { useEffect } from "react";
import { startAgent, stopAgent } from "@/lib/agent-engine";
import { useStore } from "@/lib/store";

export function useAgent() {
  const isAgentRunning = useStore((state) => state.isAgentRunning);
  const agentSpeed = useStore((state) => state.agentSpeed);

  useEffect(() => {
    startAgent();
    return () => {
      stopAgent();
    };
  }, [agentSpeed]);

  return { isAgentRunning };
}
