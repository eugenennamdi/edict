const { ethers } = require("hardhat");
const crypto = require('crypto');

const CLEANVERSE_API_ID = "APP20260614112550LIDZXM";
const CLEANVERSE_API_KEY = "qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=";

async function main() {
  const [deployer] = await ethers.getSigners();
  const contractAddress = "0x3a38D3Fa31C9a0639Ad5ba88704D8976e60b073A"; 

  const str = "base" + contractAddress.toLowerCase();
  const signature = await deployer.signMessage(str);

  const payload = {
    chain: "base",
    contract_address: contractAddress, 
    rule: {
      allowed_group: "00", // Try 00
      allowed_sub_group: "00",
      min_tier: 0,
      min_sub_tier: 0
    },
    owner_signature: signature
  };

  const key = Buffer.from(CLEANVERSE_API_KEY, 'base64');
  const iv = Buffer.alloc(16, 0);

  console.log(`\nTrying /api/cooperate/validator/register...`);
  try {
    const jsonStr = JSON.stringify(payload);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const response = await fetch(`https://uatapi.cleanverse.com/api/cooperate/validator/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-id": CLEANVERSE_API_ID
      },
      body: JSON.stringify({ data: encrypted })
    });

    const data = await response.text();
    console.log(`Response:`, response.status, data);
  } catch (e) {
    console.log(`Failed:`, e.message);
  }
}

main().catch(console.error);
