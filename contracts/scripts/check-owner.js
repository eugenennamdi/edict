const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xf99e78f043301151dF3aAe5731bCD972673FF78c"; // latest
  const Vault = await ethers.getContractFactory("EdictProxyVault");
  const vault = Vault.attach(contractAddress);
  const owner = await vault.owner();
  console.log("Owner is:", owner);
}
main().catch(console.error);
