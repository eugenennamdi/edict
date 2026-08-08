require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const CLEANVERSE_API_ID = process.env.CLEANVERSE_API_ID;
const CLEANVERSE_API_KEY = process.env.CLEANVERSE_API_KEY;

async function main() {
  const address = "0x5c53414E1f15D7668c2b9EC0A92482A64845f5f6";

  const key = Buffer.from(CLEANVERSE_API_KEY, 'base64');
  const iv = Buffer.alloc(16, 0);

  const payload = {
    customerId: "EDT1786001246233265",
    cvRecordId: "998",
    status: "1", // 1 - Activate
    wallet: {
      address: address,
      chain: "base"
    }
  };

  const jsonStr = JSON.stringify(payload);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  console.log(`\nActivating A-Pass for ${address}...`);
  try {
    const response = await fetch(`https://uatapi.cleanverse.com/api/cooperate/update_status`, {
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
