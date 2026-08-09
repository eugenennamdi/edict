"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Lock, Clock, ShieldCheck, Check, RefreshCcw, ExternalLink, Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract, useWriteContract } from "wagmi";
import { parseAbi } from "viem";

import { useStore } from "@/lib/store";

const VALIDATOR_ADDRESS = "0xaC7e5179C2C7f03f209136886c172eb34F161792";
const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";

const validatorAbi = parseAbi([
  "function complianceVerify(address poolAddress, address userAddress) external view returns (bool)"
]);

const vaultAbi = parseAbi([
  "function userDeposits(address user) external view returns (uint256)"
]);

export default function GovernancePage() {
  const { user, authenticated } = usePrivy();
  const address = user?.wallet?.address;
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const storeIsVerified = useStore((s) => s.isVerified);
  const storeCviStatus = useStore((s) => s.cviStatus);
  const pools = useStore((s) => s.pools);

  // Check CVI Status on-chain
  const { data: isCviVerified, isLoading: isCheckingCvi } = useReadContract({
    address: VALIDATOR_ADDRESS,
    abi: validatorAbi,
    functionName: "complianceVerify",
    args: [EDICT_PROXY_VAULT_ADDRESS as `0x${string}`, address as `0x${string}`],
    query: {
      enabled: authenticated && !!address,
    },
  });

  // Check Net Position (user deposits) on-chain
  const { data: userDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "userDeposits",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: authenticated && !!address,
    },
  });

  const onChainUsdc = userDepositsData !== undefined ? Number(userDepositsData) / 1e6 : 0;
  const storeUsdc = pools.USDC.totalDeposited;
  const storeEth = pools.ETH.totalDeposited * 3200;
  const storeBtc = pools.BTC.totalDeposited * 62000;

  const netPositionUsd = Math.max(onChainUsdc, storeUsdc) + storeEth + storeBtc;
  const isCviCompliant = Boolean(isCviVerified || storeIsVerified || storeCviStatus === "verified");

  const handleVote = async () => {
    if (!authenticated || !address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    // 1. Net Position Check (active position required)
    if (netPositionUsd <= 0) {
      toast.error("Voting Restricted: An active vault position is required to vote.");
      return;
    }

    // 2. CVI Compliance Check
    if (!isCviCompliant) {
      toast.error("Compliance failure: Wallet does not meet CVI requirements for governance participation.");
      return;
    }

    setVoting(true);
    
    try {
      toast.info("Simulating onchain vote transaction", {
        icon: <Loader2 className="w-4 h-4 animate-spin text-foreground" />
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Vote cast successfully!");
      setHasVoted(true);
    } catch (error) {
      toast.error("Transaction failed");
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-foreground selection:text-background flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header Section */}
        <div className="max-w-3xl mb-12 animate-fade-up">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
            Permissioned Governance
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Edict utilizes CVI-gated governance to manage protocol risks and vault operations. Only verified, accredited, and compliant entities can vote on deposit caps, venue whitelisting, and asset listings.
          </p>
        </div>

        {/* 3-Stage Lifecycle Visual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-up" style={{ animationDelay: "50ms" }}>
          
          {/* Step 1 */}
          <div className="flex flex-col gap-3 p-6 rounded-[1.5rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <div className="self-start text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded mb-2">STAGE 1</div>
            <h3 className="font-medium text-foreground tracking-tight">CVA Telemetry Screening</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              7-day automated quarantine monitoring asset health and debt backing
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-3 p-6 rounded-[1.5rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <div className="self-start text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded mb-2">STAGE 2</div>
            <h3 className="font-medium text-foreground tracking-tight">CVI-Gated Governance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Onchain voting restricted to Cleanverse CVI-verified wallets
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-3 p-6 rounded-[1.5rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
            <div className="self-start text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded mb-2">STAGE 3</div>
            <h3 className="font-medium text-foreground tracking-tight">Autonomous Strategy Deployment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Watcher agents automatically update vault allocations upon proposal execution
            </p>
          </div>

        </div>

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
          
          {/* Active Vote (Stage 2) */}
          <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-8 flex flex-col shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-transparent border-black/10 dark:border-white/10 rounded px-2 py-0.5 tracking-wider uppercase">
                [VENUE WHITELIST]
              </Badge>
              <div className="text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                STAGE 2
              </div>
            </div>
            
            <h3 className="text-2xl font-medium text-foreground tracking-tight">
              Add Protocol: Moonwell USDC
            </h3>
            
            <div className="mt-auto pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                  <span className="text-foreground font-medium">88% FOR</span>
                  <span>12% AGAINST</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden flex">
                  <div className="h-full bg-foreground" style={{ width: "88%" }} />
                  <div className="h-full bg-muted" style={{ width: "12%" }} />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground mt-1">
                  <span>Quorum: 14/10 CVI Votes</span>
                  <span>Time Left: 24h 12m</span>
                </div>
              </div>
              
              <Button 
                onClick={handleVote}
                disabled={voting || hasVoted}
                className="w-full h-12 rounded-xl text-sm font-medium shadow-md transition-all relative overflow-hidden group"
              >
                {voting ? (
                  "Verifying CVI..."
                ) : hasVoted ? (
                  <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Voted</span>
                ) : (
                  <span className="group-hover:scale-[1.02] transition-transform">
                    Cast Vote
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Screening (Stage 1) */}
          <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-8 flex flex-col shadow-sm opacity-80">
            <div className="flex items-start justify-between mb-6">
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-transparent border-black/10 dark:border-white/10 rounded px-2 py-0.5 tracking-wider uppercase">
                [NEW ASSET LISTING]
              </Badge>
              <div className="text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                STAGE 1
              </div>
            </div>
            
            <h3 className="text-2xl font-medium text-foreground tracking-tight">
              List New Vault: PYUSD
            </h3>
            
            <div className="mt-auto pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> DAY 4 OF 7</span>
                    <span>(57% Complete)</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-foreground" style={{ width: "57%" }} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs font-mono text-muted-foreground bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-lg border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground opacity-70" />
                    <span>Smart Contract Health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-foreground opacity-70" />
                    <span>Reserve & Debt Backing</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground opacity-60">
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>OFAC Sanctions Polling</span>
                  </div>
                </div>
              </div>
              
              <Button 
                disabled
                variant="outline"
                className="w-full h-12 rounded-xl text-sm font-medium border-black/10 dark:border-white/10 opacity-70"
              >
                <Lock className="w-4 h-4 mr-2" /> Voting Locked
              </Button>
            </div>
          </div>

          {/* Passed / Executed (Stage 3) */}
          <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] p-8 flex flex-col shadow-sm opacity-70 bg-gradient-to-br from-card to-black/5 dark:to-white/[0.02]">
            <div className="flex items-start justify-between mb-6">
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-transparent border-black/10 dark:border-white/10 rounded px-2 py-0.5 tracking-wider uppercase">
                [PARAMETER CHANGE]
              </Badge>
              <div className="text-[11px] font-mono text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                STAGE 3
              </div>
            </div>
            
            <h3 className="text-2xl font-medium text-foreground tracking-tight">
              Raise USDC Deposit Cap to $5M
            </h3>
            
            <div className="mt-auto pt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                  <span className="text-foreground font-medium">100% FOR</span>
                  <span>0% AGAINST</span>
                </div>
                <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden flex">
                  <div className="h-full bg-foreground" style={{ width: "100%" }} />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground mt-1">
                  <span>Final Tally: 22 CVI Votes</span>
                  <span className="text-foreground font-medium">Executed</span>
                </div>
              </div>

              <Button 
                variant="outline"
                className="w-full h-12 rounded-xl text-sm font-medium border-black/10 dark:border-white/10 bg-transparent group"
              >
                <span className="flex items-center gap-2">
                  View Execution Tx 
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </Button>
            </div>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
