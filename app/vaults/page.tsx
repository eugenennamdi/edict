import { VaultDirectoryGrid } from "@/components/vaults/vault-directory-grid";

export const metadata = {
  title: "Vaults | Edict",
  description: "Compliant ERC-4626 meta-vaults for institutional onchain yield.",
};

export default function VaultsPage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24">
      <div className="mb-12 animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
          Earn Vaults
        </h1>
        <p className="mt-3 text-muted-foreground text-base max-w-xl">
          Institutional-grade meta-vaults with autonomous compliance monitoring and real-time CVA enforcement.
        </p>
      </div>
      <VaultDirectoryGrid />
    </div>
  );
}
