const { ethers } = require("hardhat");
const crypto = require('crypto');

const CLEANVERSE_API_ID = "APP20260614112550LIDZXM";
const CLEANVERSE_API_KEY = "qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=";
const vaultAddress = "0x3a38D3Fa31C9a0639Ad5ba88704D8976e60b073A"; // expects 00 rule

async function generateAPass(address) {
  const key = Buffer.from(CLEANVERSE_API_KEY, 'base64');
  const iv = Buffer.alloc(16, 0);

  const payload = {
    customerId: "TESTX" + Date.now(),
    kycSource: "sumsub",
    kycId: "KYC_" + Date.now(),
    subTier: 1,
    subGroup: "00",
    expirationTime: Math.floor(Date.now() / 1000) + 86400 * 365,
    wallet: {
      address: address,
      chain: "base"
    },
    identityDataList: [
      {
        idType: "PASSPORT",
        fullName: "Test User",
        validUntil: "2030-12-31",
        issuingCountryISO2: "US"
      }
    ]
  };

  const jsonStr = JSON.stringify(payload);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const response = await fetch(`https://uatapi.cleanverse.com/api/cooperate/generate_apass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-id": CLEANVERSE_API_ID
    },
    body: JSON.stringify({ data: encrypted })
  });

  const data = await response.json();
  return data;
}

async function main() {
  const newWallet = ethers.Wallet.createRandom();
  console.log(`Created new wallet: ${newWallet.address}`);

  console.log(`Generating A-Pass...`);
  const apassRes = await generateAPass(newWallet.address);
  console.log(`A-Pass response:`, apassRes);

  if (apassRes.data && apassRes.data.txHash) {
    console.log(`Waiting for tx to be mined...`);
    const receipt = await ethers.provider.waitForTransaction(apassRes.data.txHash);
    console.log(`Tx status:`, receipt.status);
  } else {
    console.log(`Waiting 15 seconds for backend to process...`);
    await new Promise(r => setTimeout(r, 15000));
  }

  const validatorAddress = "0xaC7e5179C2C7f03f209136886c172eb34F161792"; 
  const validator = await ethers.getContractAt(
    ["function complianceVerify(address,address) external view returns (bool)"], 
    validatorAddress
  );

  console.log(`Testing complianceVerify...`);
  const isCompliant = await validator.complianceVerify(vaultAddress, newWallet.address);
  console.log(`complianceVerify returns:`, isCompliant);
}

main().catch(console.error);
