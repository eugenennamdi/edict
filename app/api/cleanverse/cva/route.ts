import crypto from "node:crypto";
import { NextResponse } from "next/server";

const CLEANVERSE_API_ID = process.env.CLEANVERSE_API_ID!;
const CLEANVERSE_API_KEY = process.env.CLEANVERSE_API_KEY!;
const VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";

export async function POST() {
  const timestamp = new Date().toISOString();

  try {
    const key = Buffer.from(CLEANVERSE_API_KEY, "base64");
    const iv = Buffer.alloc(16, 0);
    const payload = { wallet: { address: VAULT_ADDRESS, chain: "base" } };
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
    encrypted += cipher.final("base64");

    const response = await fetch(
      "https://uatapi.cleanverse.com/api/cooperate/query_apass",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-id": CLEANVERSE_API_ID,
        },
        body: JSON.stringify({ data: encrypted }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        compliant: false,
        code: `HTTP_${response.status}`,
        message: `Cleanverse HTTP ${response.status}`,
        timestamp,
      });
    }

    const data = await response.json();
    if (data.data) {
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(data.data, "base64", "utf8");
      decrypted += decipher.final("utf8");
      const parsed = JSON.parse(decrypted);
      const isActive = parsed.status === "1" || parsed.status === 1;

      return NextResponse.json({
        compliant: isActive,
        code: data.code || "0000",
        message: isActive
          ? `A-Pass ACTIVE | cvRecordId: ${parsed.cvRecordId || "-"}`
          : `A-Pass INACTIVE | status: ${parsed.status}`,
        timestamp,
      });
    }

    const compliant = data.code === "0000" || data.code === "1000";
    return NextResponse.json({
      compliant,
      code: data.code || "UNKNOWN",
      message: data.message || "No decryptable payload",
      timestamp,
    });
  } catch {
    return NextResponse.json({
      compliant: false,
      code: "INTERNAL_ERR",
      message: "CVA poll exception",
      timestamp,
    });
  }
}