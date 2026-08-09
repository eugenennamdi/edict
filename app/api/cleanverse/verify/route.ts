import crypto from "node:crypto";
import { NextResponse } from "next/server";

const CLEANVERSE_API_ID = process.env.CLEANVERSE_API_ID!;
const CLEANVERSE_API_KEY = process.env.CLEANVERSE_API_KEY!;

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    try {
      const key = Buffer.from(CLEANVERSE_API_KEY, 'base64');
      const iv = Buffer.alloc(16, 0);

      const payload = {
        customerId: "EDT" + Date.now() + Math.floor(Math.random() * 1000),
        tier: 1,
        subTier: 1,
        group: "01",
        subGroup: "01",
        expirationTime: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
        wallet: {
          address: address,
          chain: "base"
        }
      };

      const jsonStr = JSON.stringify(payload);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const response = await fetch("https://uatapi.cleanverse.com/api/cooperate/generate_apass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-id": CLEANVERSE_API_ID
        },
        body: JSON.stringify({ data: encrypted })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === "0000" || data.code === "1000") {
          return NextResponse.json({ verified: true, data });
        } else {
          return NextResponse.json({ verified: false, error: data.message });
        }
      } else {
        const text = await response.text();
        return NextResponse.json({ verified: false, error: text || "API Error" });
      }
    } catch (apiError) {
      console.warn("Cleanverse API call failed:", apiError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in Cleanverse API route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
