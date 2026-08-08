const { ethers } = require("hardhat");

const VAULT = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const WALLET = "0x5c53414E1f15D7668c2b9EC0A92482A64845f5f6"; // signing wallet from BaseScan

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const vault = await ethers.getContractAt(
    ["function grantRole(bytes32 role, address account) external",
     "function AGENT_ROLE() view returns (bytes32)",
     "function hasRole(bytes32 role, address account) view returns (bool)"],
    VAULT
  );

  const AGENT_ROLE = await vault.AGENT_ROLE();
  console.log("AGENT_ROLE:", AGENT_ROLE);

  const already = await vault.hasRole(AGENT_ROLE, WALLET);
  if (already) {
    console.log(`${WALLET} already has AGENT_ROLE`);
    return;
  }

  const tx = await vault.grantRole(AGENT_ROLE, WALLET);
  console.log("Granting AGENT_ROLE, tx:", tx.hash);
  await tx.wait();
  console.log("Done. AGENT_ROLE granted to", WALLET);
}

main().catch((e) => { console.error(e); process.exit(1); });
