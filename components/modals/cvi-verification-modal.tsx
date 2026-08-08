"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useAccount } from "wagmi";

export function CviVerificationModal({ amount, onComplete }: { amount: string, onComplete: () => void }) {
  const cviStatus = useStore((state) => state.cviStatus);
  const setCviStatus = useStore((state) => state.setCviStatus);
  const setIsVerified = useStore((state) => state.setIsVerified);
  
  const { address } = useAccount();
  const [step, setStep] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const [hasConfirmed, setHasConfirmed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (cviStatus === "checking") {
      setStep(0);
      setHasConfirmed(false);
      
      let isMounted = true;
      const verifyIdentity = async () => {
        // Step 1: Initial load
        await new Promise(r => setTimeout(r, 500));
        if (!isMounted) return;
        setStep(1);

        // Step 2: Make actual API call
        try {
          const response = await fetch("/api/cleanverse/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address }),
          });
          const data = await response.json();
          
          if (!isMounted) return;

          if (data.verified) {
            await new Promise(r => setTimeout(r, 800));
            if (!isMounted) return;
            setStep(2);
            
            await new Promise(r => setTimeout(r, 600));
            if (!isMounted) return;
            setStep(3);
            setCviStatus("verified");
          } else {
            toast.error("Identity verification failed.");
            setCviStatus("idle");
          }
        } catch (err) {
          console.error(err);
          if (isMounted) {
            toast.error("Identity verification service unavailable");
            setCviStatus("idle");
          }
        }
      };

      verifyIdentity();
      return () => { isMounted = false; };
    }
  }, [cviStatus, setCviStatus, address]);

  if (cviStatus === "idle" || hasConfirmed || !mounted) return null;

  const handleConfirm = () => {
    setHasConfirmed(true);
    setIsVerified(true);
    onComplete();
    setCviStatus("idle");
  };

  const handleCancel = () => {
    setCviStatus("idle");
    setStep(0);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[420px] bg-card rounded-[1.5rem] shadow-2xl border border-black/5 dark:border-white/[0.05] overflow-hidden"
      >
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-sm opacity-50 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1 p-6 md:p-8 pb-4">
          <h2 className="font-medium text-lg md:text-xl text-foreground tracking-tight">Identity Verification</h2>
        </div>

        {/* Content */}
        <div className="px-6 md:px-8 pb-8">
          <div className="flex flex-col gap-4">
            {/* Step 1 */}
            <div className="flex items-center gap-4 text-sm md:text-[15px]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                {step >= 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                ) : (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" strokeWidth={2.5} />
                )}
              </div>
              <span className={`font-medium ${step >= 1 ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                CVI Identity Verification
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-4 text-sm md:text-[15px]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                {step >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                ) : (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" strokeWidth={2.5} />
                )}
              </div>
              <span className={`font-medium ${step >= 2 ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                Jurisdiction & Country Screening
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-4 text-sm md:text-[15px]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                {step >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                ) : (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" strokeWidth={2.5} />
                )}
              </div>
              <span className={`font-medium ${step >= 3 ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                A-Pass Policy Qualification
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-black/5 dark:border-white/[0.05] p-6 md:p-8 sm:flex-row sm:justify-end bg-black/[0.02] dark:bg-white/[0.01]">
          <Button 
            onClick={handleConfirm}
            disabled={cviStatus !== "verified"}
            className="w-full h-11 md:h-12 rounded-full text-[15px] font-medium"
          >
            Confirm Deposit
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
