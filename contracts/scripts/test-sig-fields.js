const { ethers } = require("hardhat");
const crypto = require('crypto');

async function main() {
  const [deployer] = await ethers.getSigners();
  const apiKey = "qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=";
  const apiId = "APP20260614112550LIDZXM";
  const key = Buffer.from(apiKey, 'base64');
  
  const contractAddress = "0xf99e78f043301151dF3aAe5731bCD972673FF78c"; // latest
  const chain = "base";
  
  const sigFields = ["sign", "sig", "ownerSignature", "owner_signature", "contract_owner_signature"];

  for (const field of sigFields) {
      const payload = { contract_address: contractAddress, chain };
      payload[field] = "0x1234";
      
      const iv = Buffer.alloc(16, 0);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const response = await fetch("https://uatapi.cleanverse.com/api/cooperate/validator/register", {
        method: "POST", headers: { "Content-Type": "application/json", "api-id": apiId }, body: JSON.stringify({ data: encrypted })
      });
      const data = await response.json();
      console.log("Tested", field, "->", data);
  }
}

main().catch(console.error);
