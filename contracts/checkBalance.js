const { ethers } = require("ethers");
const rpcUrl = "https://sepolia.base.org";
const provider = new ethers.JsonRpcProvider(rpcUrl);
const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
const usdc = new ethers.Contract(usdcAddress, abi, provider);
async function main() {
  const decimals = await usdc.decimals();
  console.log("Decimals:", decimals);
}
main();
