"use client";

import { useWriteContract } from "wagmi";
import { parseAbi } from "viem";

export const EDICT_PROXY_VAULT_ADDRESS =
  "0x28E41078B83c7f756f875c834635627Dd9ecCB1D" as const;

// Confirmed via vault.aaveV3Pool() on 2026-08-06 — matches deploy.js
export const AAVE_V3_POOL_BASE_SEPOLIA =
  "0x8bab6d1b75f19e9ed9fce8b9bd338844ff79ae27" as `0x${string}`;

const VAULT_ABI = parseAbi([
  "function rebalance(address failingProtocol, address[] memory safeProtocols) external",
]);

/** Returns an async fn that submits the rebalance tx and resolves with the hash. */
export function useEdictRebalance() {
  const { writeContractAsync } = useWriteContract();

  async function triggerFlightToSafety(): Promise<`0x${string}`> {
    return writeContractAsync({
      address: EDICT_PROXY_VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "rebalance",
      // safeProtocols must be non-empty per contract guard; vault address = sentinel
      // for "idle" — capital stays in vault, no onward deployment.
      args: [AAVE_V3_POOL_BASE_SEPOLIA, [EDICT_PROXY_VAULT_ADDRESS]],
    });
  }

  return { triggerFlightToSafety };
}
