import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

const VAULT = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const USER = "0x5c53b1b9d4c7b80a496f8b6f79024f0c436ff5f6"; // Estimated from screenshot

const ABI = parseAbi([
  "function balanceOf(address) external view returns (uint256)",
  "function maxWithdraw(address) external view returns (uint256)",
  "function convertToAssets(uint256) external view returns (uint256)",
  "function userDeposits(address) external view returns (uint256)",
  "function depositOf(address) external view returns (uint256)",
  "function totalDeposits() external view returns (uint256)"
]);

async function check(fn, args=[]) {
  try {
    const res = await client.readContract({
      address: VAULT, abi: ABI, functionName: fn, args
    });
    console.log(`${fn}:`, res);
  } catch (e) {}
}

await check("totalDeposits");
await check("balanceOf", [USER]);
await check("maxWithdraw", [USER]);
await check("userDeposits", [USER]);
await check("depositOf", [USER]);
