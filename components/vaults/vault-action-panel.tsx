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

const EDICT_PROXY_VAULT_ADDRESS = "0xE9E6792401d53009d6768ba0A03b5Db6a71032D4";
const TESTNET_USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx/";

const vaultAbi = parseAbi(["function deposit(uint256 amount) external"]);

type TabId = "deposit" | "withdraw";

interface TxRecord {
  hash: string;
  type: "Deposit" | "Withdraw";
  amount: string;
  status: "pending" | "confirmed";
  ts: Date;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

interface VaultActionPanelProps {
  isActive: boolean;
}

export function VaultActionPanel({ isActive }: VaultActionPanelProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("deposit");
  const [depositAmount, setDepositAmount] = React.useState("");
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [txRecords, setTxRecords] = React.useState<TxRecord[]>([]);

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

  // ── USDC balance ─────────────────────────────────────────────────────────
  const { data: usdcBalanceData } = useReadContract({
    address: TESTNET_USDC_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && isActive },
  });
  const usdcBalance = usdcBalanceData ? Number(usdcBalanceData) / 1e6 : 0;

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
      setTxRecords((prev) =>
        prev.map((r) =>
          r.hash === depositHash ? { ...r, status: "confirmed" } : r
        )
      );
      setDepositAmount("");
    }
  }, [isDepositConfirmed, depositHash]);

  // Track pending deposit tx
  React.useEffect(() => {
    if (depositHash) {
      setTxRecords((prev) => {
        if (prev.some((r) => r.hash === depositHash)) return prev;
        return [
          { hash: depositHash, type: "Deposit" as const, amount: depositAmount, status: "pending" as const, ts: new Date() },
          ...prev,
        ].slice(0, 10);
      });
    }
  }, [depositHash]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (isApproveError && approveError) toast.error("Approval failed", { description: approveError.message.slice(0, 100) });
    if (isDepositError && depositError) toast.error("Deposit failed", { description: depositError.message.slice(0, 100) });
  }, [isApproveError, approveError, isDepositError, depositError]);

  React.useEffect(() => {
    if (isApproveConfirmError && approveConfirmError) toast.error("Approval reverted");
    if (isDepositConfirmError && depositConfirmError) toast.error("Deposit reverted");
  }, [isApproveConfirmError, approveConfirmError, isDepositConfirmError, depositConfirmError]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isBusy = isApprovePending || isApproveConfirming || isDepositPending || isDepositConfirming;

  const getButtonText = () => {
    if (!mounted || !isConnected) return "Connect Wallet";
    if (!isActive) return "Market Closed";
    if (!depositAmount || Number(depositAmount) <= 0) return "Enter an amount";
    if (isApprovePending || isApproveConfirming) return "Approving USDC…";
    if (isDepositPending || isDepositConfirming) return "Confirming Deposit…";
    return "Review Deposit";
  };

  const isButtonDisabled =
    isConnected &&
    (!isActive || !depositAmount || Number(depositAmount) <= 0 || isBusy);

  const handleAction = () => {
    if (!isConnected) { login(); return; }
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    setIsAlertOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
        {/* Tab row */}
        <div className="flex border-b border-black/5 dark:border-white/[0.03]">
          {(["deposit", "withdraw"] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-mono tracking-[0.15em] uppercase transition-colors ${
                activeTab === tab
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "deposit" ? (
                <ArrowDownToLine className="w-3 h-3" />
              ) : (
                <ArrowUpFromLine className="w-3 h-3" />
              )}
              {tab}
            </button>
          ))}
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

          {/* Withdraw placeholder */}
          {activeTab === "withdraw" && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 gap-2">
              <ArrowUpFromLine className="w-8 h-8" />
              <p className="text-sm font-mono uppercase tracking-widest">
                Coming soon
              </p>
            </div>
          )}

          {/* Summary card */}
          {activeTab === "deposit" && (
            <div className="flex flex-col gap-3 border border-black/5 dark:border-white/[0.05] rounded-[1.25rem] p-4 bg-background/40 dark:bg-background/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">Base Sepolia</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit APY</span>
                <span className="font-medium font-mono">
                  {apysLoading ? <span className="animate-pulse">--%</span> : `${currentApy}%`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Compliance Risk</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Low</span>
              </div>
              {depositAmount && Number(depositAmount) > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-black/5 dark:border-white/[0.04]">
                  <span className="text-muted-foreground">Est. monthly yield</span>
                  <span className="font-medium font-mono">
                    ${((Number(depositAmount) * Number(currentApy) / 100) / 12).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          {activeTab === "deposit" && (
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
      {txRecords.length > 0 && (
        <div className="bg-card border border-black/5 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-black/5 dark:border-white/[0.03]">
            <div className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Recent Transactions
            </div>
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/[0.03]">
            {txRecords.map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between px-6 py-3.5 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    tx.type === "Deposit" ? "bg-emerald-500/10" : "bg-blue-500/10"
                  }`}>
                    {tx.type === "Deposit"
                      ? <ArrowDownToLine className="w-3 h-3 text-emerald-500" />
                      : <ArrowUpFromLine className="w-3 h-3 text-blue-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{tx.type}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">${tx.amount} USDC</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase tracking-widest h-auto px-2 py-0.5 ${
                      tx.status === "confirmed"
                        ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                        : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                    }`}
                  >
                    {tx.status === "confirmed"
                      ? <CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />
                      : <Loader2 className="w-2.5 h-2.5 mr-1 inline animate-spin" />}
                    {tx.status}
                  </Badge>
                  <a
                    href={`${BASESCAN_TX_URL}${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/50 hover:text-foreground transition-colors"
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
              You must verify your identity before making a deposit. This process only takes a few moments.
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
