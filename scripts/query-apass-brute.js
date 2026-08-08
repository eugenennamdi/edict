require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const CLEANVERSE_API_ID = process.env.CLEANVERSE_API_ID;
const CLEANVERSE_API_KEY = process.env.CLEANVERSE_API_KEY;

async function query(payload) {
  const key = Buffer.from(CLEANVERSE_API_KEY, 'base64');
  const iv = Buffer.alloc(16, 0);

  const jsonStr = JSON.stringify(payload);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const response = await fetch(`https://uatapi.cleanverse.com/api/cooperate/query_apass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-id": CLEANVERSE_API_ID
    },
    body: JSON.stringify({ data: encrypted })
  });

  const data = await response.json();
  if (data.data) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(data.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } else {
    return data;
  }
}

async function main() {
  const address = "0x5c53414E1f15D7668c2b9EC0A92482A64845f5f6";
  
  const payloads = [
    { chain: "base", address: address },
    { chain_type: "base", wallet_address: address },
    { chainType: "base", walletAddress: address },
    { chain: "base", wallet: address }
  ];

  for (const p of payloads) {
    console.log(`\nTrying payload:`, p);
    try {
      const res = await query(p);
      console.log(`Result:`, res);
      if (res.code === "0000") break;
    } catch (e) {
      console.log(`Error:`, e.message);
    }
  }
}

main().catch(console.error);
