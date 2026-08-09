import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAgent, stopAgent } from "../lib/agent-engine";
import { useStore } from "../lib/store";

describe("Watcher Agent telemetry engine", () => {
  beforeEach(() => {
    stopAgent();
    useStore.getState().resetProtocols();
    useStore.getState().clearLogs();
    useStore.getState().setAgentSpeed(10);
  });

  afterEach(() => {
    stopAgent();
    vi.restoreAllMocks();
  });

  it("toggles the store running flag through the real agent lifecycle", () => {
    expect(useStore.getState().isAgentRunning).toBe(false);

    startAgent();
    expect(useStore.getState().isAgentRunning).toBe(true);

    stopAgent();
    expect(useStore.getState().isAgentRunning).toBe(false);
  });

  it("adds real CVA telemetry to the store after a polling tick", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          compliant: true,
          code: "0000",
          message: "A-Pass ACTIVE",
          timestamp: "2026-08-09T00:00:00.000Z",
        }),
      })
    );

    startAgent();

    await vi.waitFor(() => {
      expect(useStore.getState().pools.USDC.logs.length).toBeGreaterThan(0);
    });
    stopAgent();

    expect(useStore.getState().pools.USDC.logs[0].message).toContain(
      "CVA check passed"
    );
    expect(fetch).toHaveBeenCalledWith("/api/cleanverse/cva", {
      method: "POST",
    });
  });

  it("redistributes a violated protocol through the real rebalance path", async () => {
    useStore.getState().deposit(100);
    useStore.getState().triggerViolation("aave");

    startAgent();

    await vi.waitFor(() => {
      expect(
        useStore
          .getState()
          .pools.USDC.protocols.find((protocol) => protocol.id === "aave")
          ?.status
      ).toBe("rebalancing");
    });

    const protocols = useStore.getState().pools.USDC.protocols;
    expect(protocols.find((protocol) => protocol.id === "aave")?.amount).toBe(0);
    expect(protocols.find((protocol) => protocol.id === "morpho")?.amount).toBe(50);
    expect(protocols.find((protocol) => protocol.id === "moonwell")?.amount).toBe(50);
  });
});
