"use client";

import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { AssetToggle } from "@/components/vault/asset-toggle";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ProtocolAllocation, VaultReserveRow } from "@/components/vault/protocol-allocation";
import { PositionChart } from "@/components/vault/position-chart";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi(["function userDeposits(address user) external view returns (uint256)"]);

export default function PositionsPage() {
  const { ready, authenticated, login } = usePrivy();
  const { address } = useAccount();
  const { activeTab, pools } = useStore();
  const pool = pools[activeTab];
  const simulationProtocols = useStore((s) => s.pools[activeTab].simulationProtocols);
  const idleVaultCapital = useStore((s) => s.pools[activeTab].idleVaultCapital);

  // During simulation use simulationProtocols so allocations reflect flight-to-safety
  const displayProtocols = simulationProtocols ?? pool.protocols;

  const isConnected = ready && authenticated;

  // Fetch real deposits from Vault
  const { data: userDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "userDeposits",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && activeTab === "USDC",
    },
  });

  // Default to mock data for other tabs, use real data for USDC
  const realTotalDeposited = activeTab === "USDC"
    ? (userDepositsData !== undefined ? Number(userDepositsData) / 10 ** 6 : 0)
    : pool.totalDeposited;

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24">
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-12 md:p-16 border border-black/5 dark:border-white/[0.03] shadow-2xl rounded-[2rem] bg-card gap-6 mt-12">
          
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-black/5 to-transparent dark:from-white/10 dark:to-transparent border border-black/10 dark:border-white/10 flex items-center justify-center text-muted-foreground shadow-inner">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-foreground/10 to-transparent opacity-50" />
            <Wallet className="w-9 h-9 opacity-80" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">No Wallet Connected</h2>
            <p className="text-muted-foreground max-w-[420px] text-[15px] leading-relaxed mx-auto">
              Please connect your wallet to view your active positions and allocations across all protocols.
            </p>
          </div>
          
          <Button 
            onClick={login}
            className="mt-2 h-12 px-8 rounded-full text-[15px] font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            Get Started
          </Button>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 pt-32 pb-24">
      <AssetToggle 
        title="Active Positions" 
        description="Track your current holdings, real-time yield, and portfolio performance."
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fade-up items-start">
        <div className="lg:col-span-12 flex flex-col gap-6">
          
          <Card className="w-full bg-card border-black/5 dark:border-white/[0.03] shadow-2xl rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 md:p-8 flex flex-col gap-3">
                <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium">Net Position</div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="text-4xl md:text-[40px] font-sans text-foreground/90 tracking-[-0.03em] font-medium leading-none">
                    {formatCurrency(realTotalDeposited * (activeTab === "ETH" ? 3200 : activeTab === "BTC" ? 62000 : 1))}
                  </div>
                  <div className="text-[14px] font-sans text-muted-foreground tracking-wide font-medium">
                    {realTotalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {activeTab}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <PositionChart />

          <Card className="w-full bg-card border-black/5 dark:border-white/[0.03] shadow-xl rounded-[1.5rem] overflow-hidden">
            {/* Header */}
            <div className="px-7 py-5 border-b border-black/5 dark:border-white/[0.03] flex items-center justify-between">
              <h2 className="text-base font-medium text-foreground tracking-tight">
                Portfolio Allocation
              </h2>
            </div>
            
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 px-7 py-3 border-b border-black/5 dark:border-white/[0.03] bg-black/[0.015] dark:bg-white/[0.015]">
              <div className="col-span-5 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">Protocol</div>
              <div className="col-span-4 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase">Exposure</div>
              <div className="col-span-3 text-[9px] font-mono tracking-widest text-muted-foreground/50 uppercase text-right">Holdings</div>
            </div>

            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-black/5 dark:divide-white/[0.03]">
                {realTotalDeposited > 0 ? (
                  <>
                    {displayProtocols.map((protocol) => {
                      const isRebalancing = displayProtocols.some(p => p.status === 'violation' || p.status === 'rebalancing');
                      const hasExited = displayProtocols.some(p => p.status === 'exited');
                      const systemState = isRebalancing ? "rebalancing" : hasExited ? "settled" : "initial";
                      const totalWithReserve = realTotalDeposited + idleVaultCapital;
                      return (
                        <ProtocolAllocation
                          key={protocol.id}
                          protocol={protocol}
                          totalValue={realTotalDeposited}
                          totalWithReserve={totalWithReserve}
                          systemState={systemState}
                        />
                      );
                    })}
                    <VaultReserveRow
                      idleVaultCapital={idleVaultCapital}
                      totalWithReserve={realTotalDeposited + idleVaultCapital}
                    />
                  </>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground font-medium">
                    No active deposits in {activeTab}.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
