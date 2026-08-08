const { ethers } = require("hardhat");
const crypto = require('crypto');

async function main() {
  const [deployer] = await ethers.getSigners();
  const apiKey = "qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=";
  const apiId = "APP20260614112550LIDZXM";
  const key = Buffer.from(apiKey, 'base64');
  
  const contractAddress = "0xf99e78f043301151dF3aAe5731bCD972673FF78c"; // latest
  const chain = "base";
  
  const cleanAddr = contractAddress.toLowerCase().replace("0x", "");
  
  const messagesToHash = [
    chain + contractAddress.toLowerCase(),
    chain + cleanAddr,
    chain + "0x" + cleanAddr,
    "8453" + contractAddress.toLowerCase(),
    "8453" + cleanAddr
  ];
  
  for (const msg of messagesToHash) {
    const hash1 = ethers.id(msg); // keccak256 of string
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes(msg));
    
    // signMessage (EIP-191)
    const sig1 = await deployer.signMessage(ethers.getBytes(hash1));
    const sig2 = await deployer.signMessage(msg);
    
    // raw ECDSA
    const signingKey = new ethers.SigningKey(process.env.PRIVATE_KEY);
    const sig3 = signingKey.sign(hash1).serialized;
    const sig4 = signingKey.sign(ethers.getBytes(hash1)).serialized;
    
    // signMessage without hashing
    const sig5 = await deployer.signMessage(msg);
    
    const allSigs = [sig1, sig2, sig3, sig4, sig5];
    for (const signature of allSigs) {
      for (const sigToUse of [signature, signature.replace("0x", ""), signature.toLowerCase()]) {
        const payload = {
          contract_address: contractAddress,
          chain: chain,
          owner_signature: sigToUse
        };
        const iv = Buffer.alloc(16, 0);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const response = await fetch("https://uatapi.cleanverse.com/api/cooperate/validator/register", {
          method: "POST", headers: { "Content-Type": "application/json", "api-id": apiId }, body: JSON.stringify({ data: encrypted })
        });
        const data = await response.json();
        if (data.code === "0000") {
          console.log("SUCCESS REGISTER!", msg, sigToUse);
          return;
        }
      }
    }
  }
  console.log("ALL REGISTER FAILED AGAIN");
}

main().catch(console.error);
