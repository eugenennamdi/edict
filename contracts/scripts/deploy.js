const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const usdcAddress   = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
  const aaveV3Pool    = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";
  const morphoBlue    = "0x0000000000000000000000000000000000000001";
  const moonwell      = "0x0000000000000000000000000000000000000002";
  const validator     = "0xaC7e5179C2C7f03f209136886c172eb34F161792";

  const EdictProxyVault = await ethers.getContractFactory("EdictProxyVault");
  const vault = await EdictProxyVault.deploy(usdcAddress, aaveV3Pool, morphoBlue, moonwell, validator);
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("EdictProxyVault deployed to:", vaultAddress);

  // Grant AGENT_ROLE to deployer
  const AGENT_ROLE = await vault.AGENT_ROLE();
  const roleTx = await vault.grantRole(AGENT_ROLE, deployer.address);
  await roleTx.wait();
  console.log("Granted AGENT_ROLE to deployer");

  // Initialize a permissive compliance rule so complianceVerify() has a
  // defined policy immediately — prevents the "zero-rules ambiguity" state.
  const ruleTx = await vault.addRuleV2FromContract([
    "0x0000", // allowedGroup  — any
    "0x0000", // allowedSubGroup — any
    0,        // minTier
    0,        // minSubTier
    0n,       // poolCountryBitmap — no restriction
  ]);
  await ruleTx.wait();
  console.log("Initialized permissive RuleV2 on validator");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
