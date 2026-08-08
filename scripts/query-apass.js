const crypto = require('crypto');

const CLEANVERSE_API_ID = "APP20260614112550LIDZXM";
const CLEANVERSE_API_KEY = "qhfPE24VqLv7wTK7AXMkD4p2i7zKnerg84AtT0IGto0=";

async function main() {
  const address = "0x5c53414E1f15D7668c2b9EC0A92482A64845f5f6";

  const key = Buffer.from(CLEANVERSE_API_KEY, 'base64');
  const iv = Buffer.alloc(16, 0);

  const payload = {
    wallet: {
      address: address,
      chain: "base"
    }
  };

  const jsonStr = JSON.stringify(payload);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  console.log(`\nQuerying A-Pass for ${address}...`);
  try {
    const response = await fetch(`https://uatapi.cleanverse.com/api/cooperate/query_apass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-id": CLEANVERSE_API_ID
      },
      body: JSON.stringify({ data: encrypted })
    });

    const data = await response.json();
    
    // Decrypt data if present
    if (data.data) {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(data.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      console.log(`Decrypted response:`, JSON.parse(decrypted));
    } else {
      console.log(`Response:`, data);
    }
  } catch (e) {
    console.log(`Failed:`, e.message);
  }
}

main().catch(console.error);
