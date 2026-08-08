"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AttestationModal() {
  const showAttestation = useStore((state) => state.showAttestation);
  const data = useStore((state) => state.attestationData);
  const dismiss = useStore((state) => state.dismissAttestation);

  useEffect(() => {
    if (showAttestation && data) {
      toast("CVA Failure Simulated", {
        description: "Rebalancing in Progress",
      });
      
      // Clear the modal state from the store so it doesn't fire repeatedly
      dismiss();
    }
  }, [showAttestation, data, dismiss]);

  return null;
}
