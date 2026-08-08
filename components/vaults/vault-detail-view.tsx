"use client";

import { VaultDetailHeader } from "./vault-detail-header";
import { AllocationTable } from "./allocation-table";
import { WatcherTerminal } from "./watcher-terminal";
import { VaultActionPanel } from "./vault-action-panel";

interface VaultDetailViewProps {
  vaultId: string;
}

export function VaultDetailView({ vaultId }: VaultDetailViewProps) {
  // Only USDC is live; others would gate here
  const isActive = vaultId === "usdc";

  return (
    <div className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24">


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up" style={{ animationDelay: "80ms" }}>
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <VaultDetailHeader vaultId={vaultId} isActive={isActive} />
          <AllocationTable isActive={isActive} />
          <WatcherTerminal isActive={isActive} />
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-32">
          <VaultActionPanel isActive={isActive} />
        </div>
      </div>
    </div>
  );
}
