/**
 * setup-rules.js
 * Run immediately after deploy to initialize a permissive RuleV2 on the vault
 * so complianceVerify() has a defined policy instead of an empty-rules state.
 *
 * Usage:
 *   npx hardhat run scripts/setup-rules.js --network baseSepolia
 */
const { ethers } = require("hardhat");

const VAULT = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";

// Permissive testnet rule:
//   allowedGroup     = 0x0000  (any group)
//   allowedSubGroup  = 0x0000  (any sub-group)
//   minTier          = 0       (no minimum tier)
//   minSubTier       = 0       (no minimum sub-tier)
//   poolCountryBitmap = 0      (no country restriction)
const PERMISSIVE_RULE = {
  allowedGroup:    "0x0000",
  allowedSubGroup: "0x0000",
  minTier:         0,
  minSubTier:      0,
  poolCountryBitmap: 0n,
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Signer:", deployer.address);

  const vault = await ethers.getContractAt(
    [
      "function setRuleV2FromContract(tuple(bytes2,bytes2,uint8,uint8,uint256) rule) external",
      "function addRuleV2FromContract(tuple(bytes2,bytes2,uint8,uint8,uint256) rule) external",
      "function getRulesV2() external view returns (tuple(bytes2,bytes2,uint8,uint8,uint256)[])",
    ],
    VAULT
  );

  const existing = await vault.getRulesV2();
  console.log("Existing rules:", existing.length);
  existing.forEach((r, i) =>
    console.log(`  Rule[${i}]:`, JSON.stringify({
      allowedGroup: r[0], allowedSubGroup: r[1],
      minTier: Number(r[2]), minSubTier: Number(r[3]),
      poolCountryBitmap: r[4].toString()
    }))
  );

  if (existing.length > 0) {
    console.log("Rules already configured — no action needed.");
    console.log("To change rules, use the Cleanverse API (re-register-permissive.js).");
    return;
  }

  console.log("No rules found — adding permissive rule.");
  const tx = await vault.addRuleV2FromContract([
    PERMISSIVE_RULE.allowedGroup,
    PERMISSIVE_RULE.allowedSubGroup,
    PERMISSIVE_RULE.minTier,
    PERMISSIVE_RULE.minSubTier,
    PERMISSIVE_RULE.poolCountryBitmap,
  ]);
  console.log("addRuleV2FromContract tx:", tx.hash);
  await tx.wait();
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
