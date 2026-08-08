"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAaveApys } from "@/hooks/useAaveApys";
import { ArrowUpRight, Lock, Hourglass, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// ── Inline SVG icons (same source as asset-toggle.tsx) ────────────────────────
const UsdcIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 0c8.837 0 16 7.163 16 16s-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0zm3.352 5.56c-.244-.12-.488 0-.548.243-.061.061-.061.122-.061.243v.85l.01.104a.86.86 0 00.355.503c4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85l.005.088a.45.45 0 00.36.397c.061 0 .183 0 .244-.06a10.895 10.895 0 007.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162zm-6.46-.06c-.061 0-.183 0-.244.06a10.895 10.895 0 00-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85l-.01-.08c-.042-.169-.199-.362-.355-.466-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85l-.005-.088a.45.45 0 00-.36-.397zm3.535 3.156h-.915l-.088.008c-.2.04-.346.212-.4.478v1.396l-.207.032c-1.708.304-2.778 1.483-2.778 2.942 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036l-.079.007a.413.413 0 00-.347.418v.06l.033.18c.29 1.424 1.266 2.443 3.197 2.734v1.457l.008.088c.04.198.213.344.48.397h.914l.088-.008c.2-.04.346-.212.4-.477V21.34l.207-.04c1.713-.362 2.84-1.601 2.84-3.177 0-2.124-1.28-2.852-3.84-3.156-1.829-.243-2.194-.728-2.194-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 00.427.303h.975l.079-.006a.413.413 0 00.348-.419v-.06l-.037-.173a3.04 3.04 0 00-2.706-2.316V9.142l-.008-.088c-.04-.199-.213-.345-.48-.398z" />
  </svg>
);

const EthIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor">
    <g fillRule="evenodd">
      <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm7.994-15.781L16.498 4 9 16.22l7.498 4.353 7.496-4.354zM24 17.616l-7.502 4.351L9 17.617l7.498 10.378L24 17.616z" />
      <g fillRule="nonzero">
        <path fillOpacity={0.298} d="M16.498 4v8.87l7.497 3.35zm0 17.968v6.027L24 17.616z" />
        <path fillOpacity={0.801} d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
        <path fillOpacity={0.298} d="M9 16.22l7.498 4.353v-7.701z" />
      </g>
    </g>
  </svg>
);

const BtcIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor">
    <path fillRule="evenodd" d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm7.189-17.98c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z" />
  </svg>
);

const BaseNetworkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1280 1280" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,101.12c0-34.64,0-51.95,6.53-65.28,6.25-12.76,16.56-23.07,29.32-29.32C49.17,0,66.48,0,101.12,0h1077.76c34.63,0,51.96,0,65.28,6.53,12.75,6.25,23.06,16.56,29.32,29.32,6.52,13.32,6.52,30.64,6.52,65.28v1077.76c0,34.63,0,51.96-6.52,65.28-6.26,12.75-16.57,23.06-29.32,29.32-13.32,6.52-30.65,6.52-65.28,6.52H101.12c-34.64,0-51.95,0-65.28-6.52-12.76-6.26-23.07-16.57-29.32-29.32-6.53-13.32-6.53-30.65-6.53-65.28V101.12Z"/>
  </svg>
);

const MonadNetworkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 105 105" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M52.0207 0C36.9983 0 0 37.3381 0 52.4997C0 67.6613 36.9983 105 52.0207 105C67.0432 105 104.042 67.6606 104.042 52.4997C104.042 37.3388 67.0438 0 52.0207 0ZM43.9142 82.5208C37.5794 80.7787 20.5477 50.7116 22.2742 44.3184C24.0007 37.9249 53.7929 20.7368 60.1277 22.4792C66.4627 24.2213 83.4944 54.2879 81.7679 60.6813C80.0414 67.0748 50.249 84.2632 43.9142 82.5208Z" />
  </svg>
);

const ASSET_ICONS: Record<string, React.FC<{ className?: string }>> = {
  USDC: UsdcIcon,
  ETH: EthIcon,
  BTC: BtcIcon,
};

interface VaultMeta {
  id: string;
  asset: string;
  ticker: string;
  riskLabel: string;
  network: string;
  active: boolean;
}

const VAULTS: VaultMeta[] = [
  {
    id: "usdc",
    asset: "USDC Vault",
    ticker: "USDC",
    riskLabel: "CVA PASSED",
    network: "Base Sepolia",
    active: true,
  },
  {
    id: "eth",
    asset: "ETH Vault",
    ticker: "ETH",
    riskLabel: "CVA PASSED",
    network: "Base Sepolia",
    active: false,
  },
  {
    id: "btc",
    asset: "BTC Vault",
    ticker: "BTC",
    riskLabel: "CVA PASSED",
    network: "Monad Testnet",
    active: false,
  },
];

function AssetIcon({ ticker }: { ticker: string }) {
  const Icon = ASSET_ICONS[ticker];
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/[0.06] dark:bg-white/[0.08] shrink-0">
      {Icon && <Icon className="w-6 h-6 text-foreground/80" />}
    </div>
  );
}

import { useReadContract } from "wagmi";
import { parseAbi } from "viem";

const EDICT_PROXY_VAULT_ADDRESS = "0x28E41078B83c7f756f875c834635627Dd9ecCB1D";
const vaultAbi = parseAbi(["function totalDeposits() external view returns (uint256)"]);

function VaultCard({ vault, apy, usdcDeposits }: { vault: VaultMeta; apy: string; usdcDeposits: number }) {
  const isUsdc = vault.ticker === "USDC";
  const CAPACITY = 1000000;
  const filledAmount = isUsdc ? usdcDeposits : CAPACITY;
  const filledPercent = Math.min((filledAmount / CAPACITY) * 100, 100).toFixed(1);
  const availableAmount = Math.max(CAPACITY - filledAmount, 0);

  const availableFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: "compact",
    maximumFractionDigits: 1
  }).format(availableAmount);

  const displayApy = vault.active ? apy : (vault.ticker === "ETH" ? "0.24" : vault.ticker === "BTC" ? "0.08" : "--");

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex flex-col gap-6 bg-card border rounded-[1.5rem] p-7 transition-all duration-300 ${
        vault.active
          ? "border-black/5 dark:border-white/[0.06] shadow-sm hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          : "border-black/[0.04] dark:border-white/[0.03] opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <AssetIcon ticker={vault.ticker} />
          <div className="text-base font-medium text-foreground tracking-tight">
            {vault.asset}
          </div>
        </div>

        {vault.active ? (
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground/40 mt-1" />
          </div>
        )}
      </div>

      {/* Main Metric (APY) */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="text-3xl font-mono font-medium text-foreground tracking-tight flex items-baseline gap-1.5">
          {displayApy}%
          <span className="text-[11px] tracking-[0.15em] font-sans font-bold text-muted-foreground uppercase">
            APY
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-black/5 dark:bg-white/[0.04]" />

      {/* Capacity Progress */}
      <div className="flex flex-col gap-2 pt-1 group/progress">
        <div className="flex justify-between items-center text-[11px] font-medium">
          <span className="text-muted-foreground">Capacity</span>
          <span className="text-foreground transition-all duration-300">
            <span className="group-hover/progress:hidden">{isUsdc ? `${filledPercent}% Filled` : `100% Filled`}</span>
            <span className="hidden group-hover/progress:inline">{availableFormatted} Available</span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground rounded-full transition-all duration-1000 ease-out"
            style={{ width: isUsdc ? `${filledPercent}%` : `100%` }}
          />
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="flex items-center justify-between pt-2">
        <Badge
          variant="outline"
          className="text-[10px] font-medium tracking-wide px-2 py-1 rounded-md border-black/10 dark:border-white/10 text-foreground bg-transparent flex items-center gap-1.5 shadow-none"
        >
          <CheckCircle2 className="w-3 h-3 text-foreground" />
          {vault.riskLabel}
        </Badge>

        <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          {vault.network.includes("Base") ? (
            <BaseNetworkIcon className="w-3.5 h-3.5 text-foreground/60" />
          ) : vault.network.includes("Monad") ? (
            <MonadNetworkIcon className="w-3 h-3 text-foreground/60" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
          )}
          {vault.network === "-" ? "TBA" : vault.network}
        </div>
      </div>
    </motion.div>
  );

  if (!vault.active) return inner;
  return <Link href={`/vaults/${vault.id}`}>{inner}</Link>;
}

export function VaultDirectoryGrid() {
  const { apys, loading } = useAaveApys();

  const { data: totalDepositsData } = useReadContract({
    address: EDICT_PROXY_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: "totalDeposits",
  });
  
  const usdcDeposits = totalDepositsData !== undefined ? Number(totalDepositsData) / 10 ** 6 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {VAULTS.map((vault) => (
        <VaultCard
          key={vault.id}
          vault={vault}
          apy={loading ? "--" : apys[vault.ticker as keyof typeof apys] ?? "--"}
          usdcDeposits={usdcDeposits}
        />
      ))}
    </div>
  );
}
