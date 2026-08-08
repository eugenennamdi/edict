import { notFound } from "next/navigation";
import { VaultDetailView } from "@/components/vaults/vault-detail-view";

export async function generateStaticParams() {
  return [{ id: "usdc" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const labels: Record<string, string> = {
    usdc: "USDC Vault",
    eth: "ETH Vault",
    btc: "BTC Vault",
  };
  const name = labels[id.toLowerCase()] ?? "Vault";
  return { title: `${name} | Edict`, description: `Institutional ${name} with live CVA compliance telemetry.` };
}

const VALID_IDS = ["usdc", "eth", "btc"];

export default async function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!VALID_IDS.includes(id.toLowerCase())) notFound();
  return <VaultDetailView vaultId={id.toLowerCase()} />;
}
