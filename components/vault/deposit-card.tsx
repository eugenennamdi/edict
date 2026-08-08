"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { usePrivy } from "@privy-io/react-auth";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbi } from "viem";
import { CviVerificationModal } from "@/components/modals/cvi-verification-modal";
import { toast } from "sonner";
import { erc20Abi } from "viem";
import { useAaveApys } from "@/hooks/useAaveApys";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const TESTNET_USDC_ADDRESS = "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f";
const vaultAbi = parseAbi(["function deposit(uint256 amount) external"]);

export function DepositCard() {
  const { ready, authenticated, login } = usePrivy();
  const { address } = useAccount();
  const isConnected = ready && authenticated;
  const setCviStatus = useStore((state) => state.setCviStatus);
  const cviStatus = useStore((state) => state.cviStatus);
  const isVerified = useStore((state) => state.isVerified);
  const activeTab = useStore((state) => state.activeTab);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isCheckingCVI, setIsCheckingCVI] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: depositHash, isPending: isDepositPending, writeContract: writeDeposit, isError: isDepositError, error: depositError } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed, isError: isDepositConfirmError, error: depositConfirmError } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  const { data: approveHash, isPending: isApprovePending, writeContract: writeApprove, isError: isApproveError, error: approveError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed, isError: isApproveConfirmError, error: approveConfirmError } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { apys, loading: apysLoading } = useAaveApys();
  const currentApy = apys[activeTab as keyof typeof apys] || "0.00";

  // Fetch Real USDC Balance
  const { data: usdcBalanceData } = useReadContract({
    address: TESTNET_USDC_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && activeTab === "USDC",
    },
  });

  const usdcBalance = usdcBalanceData ? Number(usdcBalanceData) / 10 ** 6 : 0;
  const displayBalance =
    activeTab === "USDC" ? usdcBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "--";

  const lastDepositAmount = React.useRef(depositAmount);
  React.useEffect(() => {
    lastDepositAmount.current = depositAmount;
  }, [depositAmount]);

  React.useEffect(() => {
    if (isDepositConfirmed) {
      toast.success("Deposit successful", {
        description: `Successfully deposited ${lastDepositAmount.current} ${activeTab}`,
      });
      setDepositAmount("");
    }
  }, [isDepositConfirmed, activeTab]); 

  // Trigger Deposit once Approval is confirmed
  React.useEffect(() => {
    if (isApproveConfirmed) {
      writeDeposit({
        address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
        abi: vaultAbi,
        functionName: "deposit",
        args: [BigInt(Number(depositAmount) * 10 ** 6)],
      });
    }
  }, [isApproveConfirmed]); // Intentionally omitting depositAmount so it only runs when approval flips

  React.useEffect(() => {
    if (isApproveError && approveError) {
      toast.error("Approval failed", { description: approveError.message.slice(0, 100) + "..." });
    }
    if (isDepositError && depositError) {
      toast.error("Transaction failed", { description: depositError.message.slice(0, 100) + "..." });
    }
  }, [isApproveError, approveError, isDepositError, depositError]);

  React.useEffect(() => {
    if (isApproveConfirmError && approveConfirmError) {
      toast.error("Approval reverted", { description: approveConfirmError.message.slice(0, 100) + "..." });
    }
    if (isDepositConfirmError && depositConfirmError) {
      toast.error("Transaction reverted", { description: depositConfirmError.message.slice(0, 100) + "..." });
    }
  }, [isApproveConfirmError, approveConfirmError, isDepositConfirmError, depositConfirmError]);

  const handleAction = () => {
    if (!isConnected) {
      login();
      return;
    }
    if (!depositAmount || isNaN(Number(depositAmount))) return;

    // Open the alert dialog to inform user about identity check
    setIsAlertOpen(true);
  };

  const getButtonText = () => {
    if (!mounted || !isConnected) return "Connect Wallet";
    if (activeTab === "ETH" || activeTab === "BTC") return "Market Closed";
    if (!depositAmount || Number(depositAmount) <= 0) return "Enter an amount";
    if (isApprovePending || isApproveConfirming) return "Approving USDC...";
    if (isDepositPending || isDepositConfirming) return "Confirming Deposit...";
    return "Review Deposit";
  };

  const isButtonDisabled =
    isConnected &&
    (activeTab !== "USDC" ||
      !depositAmount ||
      Number(depositAmount) <= 0 ||
      isApprovePending ||
      isApproveConfirming ||
      isDepositPending ||
      isDepositConfirming);

  return (
    <>
      <Card className="w-full bg-card border-black/5 dark:border-white/[0.03] shadow-xl rounded-[1.5rem] overflow-hidden sticky top-6">
        <CardContent className="p-5 md:p-6 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {mounted && isConnected && (
              <motion.div
                initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Input Card */}
                <div className="flex flex-col bg-transparent rounded-[1.25rem] p-4 transition-colors border border-black/5 dark:border-white/[0.05]">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-foreground/80">
                      Deposit {activeTab}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck="false"
                      placeholder="0"
                      value={activeTab !== "USDC" ? "" : depositAmount}
                      disabled={activeTab !== "USDC"}
                      onChange={(e) =>
                        setDepositAmount(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      className="w-full !bg-transparent border-0 h-14 md:h-16 shadow-none px-0 text-2xl md:text-3xl font-sans font-medium text-foreground outline-none placeholder:text-muted-foreground/30 focus-visible:ring-0 rounded-none transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-muted-foreground">
                      {depositAmount && activeTab === "USDC"
                        ? (Number(depositAmount) * 1).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      Balance: {mounted && isConnected ? displayBalance : "--"}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDepositAmount(usdcBalance.toString())}
                        className="h-6 px-2 text-xs font-semibold"
                        disabled={!mounted || !isConnected || usdcBalance <= 0 || activeTab !== "USDC"}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction Details Card */}
          <div className="flex flex-col bg-background/40 dark:bg-background/20 border border-black/10 dark:border-white/10 rounded-[1.25rem] p-4 gap-3">
            <div className="flex justify-between items-center pb-3 border-b border-black/5 dark:border-white/[0.05]">
              <div className="text-sm text-muted-foreground">Network</div>
              <div className="text-sm font-medium flex items-center gap-2">
                {activeTab === "BTC" ? "Bitcoin" : "Ethereum"}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Deposit APY</div>
              <div className="text-sm font-medium text-foreground">
                {apysLoading ? <span className="animate-pulse">--%</span> : `${currentApy}%`}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Compliance Risk
              </div>
              <div className="font-medium text-foreground">Low</div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Projected monthly
              </div>
              <div className="text-sm font-medium font-mono text-foreground/80">
                {!mounted || !isConnected || activeTab !== "USDC"
                  ? "--"
                  : depositAmount && Number(depositAmount) > 0
                    ? (
                        (Number(depositAmount) * (Number(currentApy) / 100)) /
                        12
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "--"}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <AnimatePresence initial={false}>
            {mounted && isConnected && (
              <motion.div
                initial={{ height: 0, opacity: 0, overflow: "hidden" }}
                animate={{ height: "auto", opacity: 1, overflow: "visible" }}
                exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex flex-col gap-3 mt-2">
                  <Button
                    onClick={handleAction}
                    disabled={isButtonDisabled}
                    className="w-full h-11 md:h-12 rounded-full text-sm md:text-[15px] font-medium active:scale-[0.99]"
                  >
                    {getButtonText()}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="sm:max-w-[420px] p-6 md:p-8 overflow-hidden bg-card border-black/5 dark:border-white/[0.05] rounded-[1.5rem] shadow-2xl gap-0">
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
              className="flex items-center justify-center gap-1.5 opacity-50 transition-opacity hover:opacity-100 outline-none"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Powered by</span>
              <img src="/cleanverse-logo.png" alt="Cleanverse" className="h-3 object-contain brightness-0 dark:invert" />
            </a>
            <div className="flex w-full gap-3">
              <AlertDialogCancel className="flex-1 h-11 md:h-12 rounded-full text-[15px] m-0">Cancel</AlertDialogCancel>
              <Button
                className="flex-1 h-11 md:h-12 rounded-full text-[15px]"
                onClick={() => {
                  setIsAlertOpen(false);
                  setCviStatus("checking");
                }}
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
          // 1. Execute ERC20 Approve via wagmi
          writeApprove({
            address: TESTNET_USDC_ADDRESS as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [EDICT_PROXY_VAULT_ADDRESS as `0x${string}`, BigInt(Number(depositAmount) * 10 ** 6)],
          });
        }}
      />
    </>
  );
}
