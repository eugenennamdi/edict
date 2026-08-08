import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string | null | undefined) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) {
    const val = value / 1_000_000;
    return { value: "$" + val.toLocaleString("en-US", { maximumFractionDigits: 1 }), suffix: "M" };
  }
  if (value >= 1_000) {
    const val = value / 1_000;
    return { value: "$" + val.toLocaleString("en-US", { maximumFractionDigits: 1 }), suffix: "K" };
  }
  return { value: formatCurrency(value), suffix: "" };
}
