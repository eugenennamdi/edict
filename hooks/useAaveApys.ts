import { useState, useEffect } from "react";

export function useAaveApys() {
  // Hardcoded to match Aave V3 Base Sepolia testnet rates exactly
  const [apys, setApys] = useState({ USDC: "1.46", ETH: "1.21", BTC: "0.00" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a quick network fetch delay for UI realism
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { apys, loading };
}
