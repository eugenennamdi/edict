"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseAbi, erc20Abi } from "viem";
import { useStore } from "@/lib/store";
import { useAaveApys } from "@/hooks/useAaveApys";
import { CviVerificationModal } from "@/components/modals/cvi-verification-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ExternalLink, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, Loader2 } from "lucide-react";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const TESTNET_USDC_ADDRESS = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";

const vaultAbi = parseAbi([
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function userDeposits(address user) view returns (uint256)"
]);

const BaseNetworkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1280 1280" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,101.12c0-34.64,0-51.95,6.53-65.28,6.25-12.76,16.56-23.07,29.32-29.32C49.17,0,66.48,0,101.12,0h1077.76c34.63,0,51.96,0,65.28,6.53,12.75,6.25,23.06,16.56,29.32,29.32,6.52,13.32,6.52,30.64,6.52,65.28v1077.76c0,34.63,0,51.96-6.52,65.28-6.26,12.75-16.57,23.06-29.32,29.32-13.32,6.52-30.65,6.52-65.28,6.52H101.12c-34.64,0-51.95,0-65.28-6.52-12.76-6.26-23.07-16.57-29.32-29.32-6.53-13.32-6.53-30.65-6.53-65.28V101.12Z"/>
  </svg>
);

type TabId = "deposit" | "withdraw";

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

interface VaultActionPanelProps {
  isActive: boolean;
}

export function VaultActionPanel({ isActive }: VaultActionPanelProps) {
  const depositInputId = React.useId();
  const withdrawInputId = React.useId();
  const [activeTab, setActiveTab] = React.useState<TabId>("deposit");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const transactions = useStore((s) => s.transactions);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransactionStatus = useStore((s) => s.updateTransactionStatus);

  const queryClient = useQueryClient();
  const { ready, authenticated, login } = usePrivy();
  const { address } = useAccount();
  const isConnected = ready && authenticated;

  const setCviStatus = useStore((s) => s.setCviStatus);
  const { apys, loading: apysLoading } = useAaveApys();
  const currentApy = apys["USDC"] ?? "0.00";

  React.useEffect(() => { setMounted(true); }, []);

  // ── Contract writes ──────────────────────────────────────────────────────
  const {
    data: approveHash, isPending: isApprovePending,
    writeContract: writeApprove, isError: isApproveError, error: approveError,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming, isSuccess: isApproveConfirmed,
    isError: isApproveConfirmError, error: approveConfirmError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    data: depositHash, isPending: isDepositPending,
    writeContract: writeDeposit, isError: isDepositError, error: depositError,
  } = useWriteContract();

  const {
    isLoading: isDepositConfirming, isSuccess: isDepositConfirmed,
    isError: isDepositConfirmError, error: depositConfirmError,
  } = useWaitForTransactionReceipt({ hash: depositHash });

  const {
    data: withdrawHash, isPending: isWithdrawPending,
    writeContract: writeWithdraw, isError: isWithdrawError, error: withdrawError,
  } = useWriteContract();

  const {
    isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed,
    isError: isWithdrawConfirmError, error: withdrawConfirmError,
  } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // ── Balances ─────────────────────────────────────────────────────────────
  const { data: usdcBalanceData } = useReadContract({
    address: TESTNET_USDC_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isActive },
  });
  const usdcBalance = usdcBalanceData ? Number(usdcBalanceData) / 1e6 : 0;

  const { data: userDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "userDeposits",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isActive },
  });
  const userDeposits = userDepositsData ? Number(userDepositsData) / 1e6 : 0;

  // ── Side-effects ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isApproveConfirmed) {
      writeDeposit({
        address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
        abi: vaultAbi,
        functionName: "deposit",
        args: [BigInt(Math.floor(Number(depositAmount) * 1e6))],
      });
    }
  }, [isApproveConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (isDepositConfirmed && depositHash) {
      toast.success("Deposit confirmed");
      updateTransactionStatus(depositHash, "confirmed");
      queryClient.invalidateQueries();
    }
  }, [isDepositConfirmed, depositHash, updateTransactionStatus, queryClient]);

  // Track pending deposit tx
  React.useEffect(() => {
    if (depositHash) {
      addTransaction({
        hash: depositHash,
        type: "Deposit",
        amount: depositAmount,
        status: "pending",
        ts: new Date(),
      });
      // state reset moved to submit handler
    }
  }, [depositHash, addTransaction]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (isApproveError && approveError) toast.error("Approval failed", { description: approveError.message.slice(0, 100) });
    if (isDepositError && depositError) toast.error("Deposit failed", { description: depositError.message.slice(0, 100) });
    if (isWithdrawError && withdrawError) toast.error("Withdrawal failed", { description: withdrawError.message.slice(0, 100) });
  }, [isApproveError, approveError, isDepositError, depositError, isWithdrawError, withdrawError]);

  React.useEffect(() => {
    if (isApproveConfirmError && approveConfirmError) toast.error("Approval reverted");
    if (isDepositConfirmError && depositConfirmError) toast.error("Deposit reverted");
    if (isWithdrawConfirmError && withdrawConfirmError) toast.error("Withdrawal reverted");
  }, [isApproveConfirmError, approveConfirmError, isDepositConfirmError, depositConfirmError, isWithdrawConfirmError, withdrawConfirmError]);

  React.useEffect(() => {
    if (isWithdrawConfirmed && withdrawHash) {
      toast.success("Withdrawal confirmed");
      updateTransactionStatus(withdrawHash, "confirmed");
      queryClient.invalidateQueries();
    }
  }, [isWithdrawConfirmed, withdrawHash, updateTransactionStatus, queryClient]);

  // Track pending withdraw tx
  React.useEffect(() => {
    if (withdrawHash) {
      addTransaction({
        hash: withdrawHash,
        type: "Withdraw",
        amount: withdrawAmount,
        status: "pending",
        ts: new Date(),
      });
      // state reset moved to submit handler
    }
  }, [withdrawHash, addTransaction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isBusy = isApprovePending || isApproveConfirming || isDepositPending || isDepositConfirming || isWithdrawPending || isWithdrawConfirming;

  const getButtonText = () => {
    if (!mounted || !isConnected) return "Connect Wallet";
    if (!isActive) return "Market Closed";
    
    if (activeTab === "deposit") {
      if (!depositAmount || Number(depositAmount) <= 0) return "Enter an amount";
      if (Number(depositAmount) > usdcBalance) return "Insufficient USDC";
      if (isApprovePending || isApproveConfirming) return "Approving USDC…";
      if (isDepositPending || isDepositConfirming) return "Confirming Deposit…";
      return "Review Deposit";
    } else {
      if (!withdrawAmount || Number(withdrawAmount) <= 0) return "Enter an amount";
      if (Number(withdrawAmount) > userDeposits) return "Insufficient balance";
      if (isWithdrawPending || isWithdrawConfirming) return "Confirming Withdrawal…";
      return "Review Withdrawal";
    }
  };

  const isButtonDisabled =
    isConnected &&
    (!isActive || isBusy || (activeTab === "deposit" ? (!depositAmount || Number(depositAmount) <= 0 || Number(depositAmount) > usdcBalance) : (!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > userDeposits)));

  const handleAction = () => {
    if (!isConnected) { login(); return; }
    if (activeTab === "deposit") {
      if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) > usdcBalance) return;
      setIsAlertOpen(true);
    } else {
      if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) > userDeposits) return;
      writeWithdraw({
        address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
        abi: vaultAbi,
        functionName: "withdraw",
        args: [BigInt(Math.floor(Number(withdrawAmount) * 1e6))],
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
        {/* Tab row */}
        <div className="p-6 pb-2">
          <div className="flex bg-black/[0.04] dark:bg-white/[0.04] rounded-xl p-1 relative">
            {(["deposit", "withdraw"] as TabId[]).map((tab) => {
              const isActiveTab = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium tracking-wide capitalize transition-all rounded-lg ${
                    isActiveTab
                      ? "text-foreground bg-background dark:bg-[#1C1C1C] shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {tab === "deposit" ? (
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowUpFromLine className="w-3.5 h-3.5" />
                  )}
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Amount input – shown when connected */}
          <AnimatePresence initial={false}>
            {mounted && isConnected && activeTab === "deposit" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col border border-black/5 dark:border-white/[0.05] rounded-[1.25rem] p-4 gap-3">
                  <div className="text-sm font-medium text-foreground/80">Deposit USDC</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    name={depositInputId}
                    id={depositInputId}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="0"
                    value={depositAmount}
                    disabled={!isActive || isBusy}
                    onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="!bg-transparent border-0 h-14 shadow-none px-0 text-3xl font-mono font-medium outline-none placeholder:text-muted-foreground/30 focus-visible:ring-0"
                  />
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{depositAmount ? `$${Number(depositAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</span>
                    <div className="flex items-center gap-2">
                      <span>Balance: {usdcBalance.toFixed(2)}</span>
                      <button
                        onClick={() => setDepositAmount(usdcBalance.toString())}
                        disabled={usdcBalance <= 0}
                        className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-30"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Withdraw input */}
          <AnimatePresence initial={false}>
            {mounted && isConnected && activeTab === "withdraw" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col border border-black/5 dark:border-white/[0.05] rounded-[1.25rem] p-4 gap-3">
                  <div className="text-sm font-medium text-foreground/80">Withdraw USDC</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    name={withdrawInputId}
                    id={withdrawInputId}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="0"
                    value={withdrawAmount}
                    disabled={!isActive || isBusy}
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="!bg-transparent border-0 h-14 shadow-none px-0 text-3xl font-mono font-medium outline-none placeholder:text-muted-foreground/30 focus-visible:ring-0"
                  />
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{withdrawAmount ? `$${Number(withdrawAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</span>
                    <div className="flex items-center gap-2">
                      <span>Available: {userDeposits.toFixed(2)}</span>
                      <button
                        onClick={() => setWithdrawAmount(userDeposits.toString())}
                        disabled={userDeposits <= 0}
                        className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-30"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary card deposit */}
          {activeTab === "deposit" && (
            <div className="flex flex-col gap-3 border border-black/5 dark:border-white/[0.05] rounded-[1.25rem] p-4 bg-background/40 dark:bg-background/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium flex items-center gap-1.5">
                  <BaseNetworkIcon className="w-3.5 h-3.5 text-foreground/60" />
                  Base Sepolia
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit APY</span>
                <span className="text-xs font-medium font-mono">
                  {apysLoading ? <span className="animate-pulse">--%</span> : `${currentApy}%`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Compliance Risk</span>
                <span className="font-medium">Low</span>
              </div>
              {depositAmount && Number(depositAmount) > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-black/5 dark:border-white/[0.04]">
                  <span className="text-muted-foreground">Est. monthly yield</span>
                  <span className="text-[13px] font-semibold font-mono">
                    ${((Number(depositAmount) * Number(currentApy) / 100) / 12).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Summary card withdraw */}
          {activeTab === "withdraw" && (
            <div className="flex flex-col gap-3 border border-black/5 dark:border-white/[0.05] rounded-[1.25rem] p-4 bg-background/40 dark:bg-background/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium flex items-center gap-1.5">
                  <BaseNetworkIcon className="w-3.5 h-3.5 text-foreground/60" />
                  Base Sepolia
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available to Withdraw</span>
                <span className="text-xs font-medium font-mono">${userDeposits.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action button */}
          {isConnected && (
            <Button
              onClick={handleAction}
              disabled={isButtonDisabled}
              className="w-full h-12 rounded-full text-[15px] font-medium active:scale-[0.99]"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {getButtonText()}
            </Button>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-black/5 dark:border-white/[0.03] flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground tracking-tight">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/[0.03]">
            {transactions.map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between px-6 py-4 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    {tx.type === "Deposit"
                      ? <ArrowDownToLine className="w-3.5 h-3.5 text-foreground/70" />
                      : <ArrowUpFromLine className="w-3.5 h-3.5 text-foreground/70" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[13px] font-medium text-foreground/90">{tx.type}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">${tx.amount} USDC</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {tx.status === "confirmed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    )}
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                      {tx.status}
                    </span>
                  </div>
                  <a
                    href={`${BASESCAN_TX_URL}${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                    title="View on Basescan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CVI Gate dialogs (reused from existing components) ── */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="sm:max-w-[420px] p-6 md:p-8 bg-card border-black/5 dark:border-white/[0.05] rounded-[1.5rem] shadow-2xl gap-0 overflow-hidden">
          <AlertDialogHeader className="mb-2 text-left place-items-start sm:place-items-start sm:text-left">
            <AlertDialogTitle className="text-xl tracking-tight">Identity Verification Required</AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2">
              Your connected address must hold a valid CVI (Verified Identity) attestation to execute vault deposits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-6 mt-6">
            <a
              href="https://cleanverse.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Powered by</span>
              <img src="/cleanverse-logo.png" alt="Cleanverse" className="h-3 object-contain brightness-0 dark:invert" />
            </a>
            <div className="flex w-full gap-3">
              <AlertDialogCancel className="flex-1 h-11 md:h-12 rounded-full text-[15px] m-0">Cancel</AlertDialogCancel>
              <Button
                className="flex-1 h-11 md:h-12 rounded-full text-[15px]"
                onClick={() => { setIsAlertOpen(false); setCviStatus("checking"); }}
              >
                Verify Identity
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <CviVerificationModal
        amount={depositAmount}
        onComplete={() => {
          writeApprove({
            address: TESTNET_USDC_ADDRESS as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [EDICT_PROXY_VAULT_ADDRESS as `0x${string}`, BigInt(Math.floor(Number(depositAmount) * 1e6))],
          });
        }}
      />
    </>
  );
}
