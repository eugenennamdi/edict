import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../lib/store";

describe("EdictStore — vault state management", () => {
  beforeEach(() => {
    // Reset all three pools to prevent cross-test accumulation
    for (const tab of ["USDC", "ETH", "BTC"] as const) {
      useStore.getState().setActiveTab(tab);
      useStore.getState().resetProtocols();
      useStore.getState().clearLogs();
    }
    useStore.getState().setActiveTab("USDC");
  });

  it("deposits into the active pool and allocates to Aave (100% default)", () => {
    const baseline = useStore.getState().pools.USDC.totalDeposited;
    useStore.getState().deposit(500);
    const pool = useStore.getState().pools.USDC;

    expect(pool.totalDeposited).toBe(baseline + 500);
    const aave = pool.protocols.find((p) => p.id === "aave");
    expect(aave?.allocation).toBe(100);
  });

  it("tracks deposits independently per asset pool", () => {
    const usdcBaseline = useStore.getState().pools.USDC.totalDeposited;
    const ethBaseline = useStore.getState().pools.ETH.totalDeposited;

    useStore.getState().deposit(100); // deposits to active tab (USDC)
    useStore.getState().setActiveTab("ETH");
    useStore.getState().deposit(50);

    expect(useStore.getState().pools.USDC.totalDeposited).toBe(usdcBaseline + 100);
    expect(useStore.getState().pools.ETH.totalDeposited).toBe(ethBaseline + 50);
  });

  it("triggers a violation and transitions protocol status", () => {
    useStore.getState().deposit(200);
    useStore.getState().triggerViolation("aave");

    const aave = useStore.getState().pools.USDC.protocols.find((p) => p.id === "aave");
    expect(aave?.status).toBe("violation");
  });

  it("resetProtocols restores all protocols to compliant with correct allocations", () => {
    useStore.getState().deposit(300);
    useStore.getState().triggerViolation("aave");
    useStore.getState().resetProtocols();

    const protocols = useStore.getState().pools.USDC.protocols;
    expect(protocols.every((p) => p.status === "compliant")).toBe(true);
    expect(protocols.find((p) => p.id === "aave")?.allocation).toBe(100);
  });

  it("manages CVI verification status", () => {
    expect(useStore.getState().cviStatus).toBe("idle");
    useStore.getState().setCviStatus("checking");
    expect(useStore.getState().cviStatus).toBe("checking");
    useStore.getState().setCviStatus("verified");
    expect(useStore.getState().cviStatus).toBe("verified");
  });

  it("adds and caps logs at 200 entries", () => {
    for (let i = 0; i < 210; i++) {
      useStore.getState().addLog({ level: "info", message: `log-${i}` });
    }
    expect(useStore.getState().pools.USDC.logs.length).toBe(200);
    // newest first
    expect(useStore.getState().pools.USDC.logs[0].message).toBe("log-209");
  });

  it("tracks transactions and deduplicates by hash", () => {
    const tx = { hash: "0xabc", type: "Deposit" as const, amount: "100", status: "pending" as const, ts: new Date() };
    useStore.getState().addTransaction(tx);
    useStore.getState().addTransaction(tx); // duplicate
    expect(useStore.getState().transactions.length).toBe(1);
  });

  it("updates transaction status", () => {
    useStore.getState().addTransaction({ hash: "0xdef", type: "Withdraw", amount: "50", status: "pending", ts: new Date() });
    useStore.getState().updateTransactionStatus("0xdef", "confirmed");
    expect(useStore.getState().transactions[0].status).toBe("confirmed");
  });
});
