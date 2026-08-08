import { create } from "zustand";
import { PROTOCOLS } from "./constants";

export type ProtocolStatus = "compliant" | "violation" | "rebalancing" | "exited";
export type AssetType = "USDC" | "ETH" | "BTC";

export interface Protocol {
  id: string;
  name: string;
  allocation: number;
  amount: number;
  status: ProtocolStatus;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  level: "info" | "violation" | "action" | "success";
}

export interface AttestationData {
  id: string;
  timestamp: Date;
  trigger: string;
  withdrawn: { amount: number; protocol: string };
  deposited: { amount: number; protocol: string }[];
}

export interface AssetPool {
  globalTvl: number;
  totalDeposited: number;
  protocols: Protocol[];
  logs: LogEntry[];
}

export interface EdictStore {
  // Wallet
  walletConnected: boolean;
  walletAddress: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;

  // CVI Verification
  cviStatus: "idle" | "checking" | "verified" | "failed";
  setCviStatus: (status: "idle" | "checking" | "verified" | "failed") => void;
  isVerified: boolean;
  setIsVerified: (val: boolean) => void;

  // Vault / Asset State
  activeTab: AssetType;
  setActiveTab: (tab: AssetType) => void;
  
  pools: Record<AssetType, AssetPool>;

  // Actions scoped to activeTab
  deposit: (amount: number) => void;
  triggerViolation: (protocolId: string) => void;
  resetProtocols: () => void;
  setProtocols: (protocols: Protocol[]) => void;
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;

  // Agent Engine
  agentSpeed: number;
  setAgentSpeed: (ms: number) => void;
  isAgentRunning: boolean;
  setIsAgentRunning: (running: boolean) => void;

  // Attestation (Global for modal)
  showAttestation: boolean;
  attestationData: AttestationData | null;
  setAttestation: (data: AttestationData) => void;
  dismissAttestation: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_PROTOCOLS: Protocol[] = PROTOCOLS.map((p) => ({
  ...p,
  allocation: 33.33,
  amount: 0,
  status: "compliant",
}));

const INITIAL_POOL: AssetPool = {
  globalTvl: 0,
  totalDeposited: 0,
  protocols: [...INITIAL_PROTOCOLS],
  logs: [],
};

export const useStore = create<EdictStore>((set, get) => ({
  walletConnected: false,
  walletAddress: null,
  connectWallet: () =>
    set({
      walletConnected: true,
      walletAddress: "0x1a2bc3d4e5f678901234567890abcdef1234f3c4",
    }),
  disconnectWallet: () => set({ walletConnected: false, walletAddress: null }),

  cviStatus: "idle",
  setCviStatus: (status) => set({ cviStatus: status }),
  isVerified: false,
  setIsVerified: (val) => set({ isVerified: val }),

  activeTab: "USDC",
  setActiveTab: (tab) => set({ activeTab: tab }),

  pools: {
    USDC: { ...JSON.parse(JSON.stringify(INITIAL_POOL)), globalTvl: 0 },
    ETH: { ...JSON.parse(JSON.stringify(INITIAL_POOL)), globalTvl: 0 },
    BTC: { ...JSON.parse(JSON.stringify(INITIAL_POOL)), globalTvl: 0 },
  },

  deposit: (amount) =>
    set((state) => {
      const activeTab = state.activeTab;
      const pool = state.pools[activeTab];
      const newTotal = pool.totalDeposited + amount;
      const compliantCount = pool.protocols.filter(
        (p) => p.status === "compliant"
      ).length;

      const finalProtocols = pool.protocols.map((p) => {
        if (p.status === "compliant") {
          return {
            ...p,
            amount: newTotal / compliantCount,
            allocation: 100 / compliantCount,
          };
        }
        return { ...p, amount: 0, allocation: 0 };
      });

      return {
        pools: {
          ...state.pools,
          [activeTab]: {
            ...pool,
            totalDeposited: newTotal,
            protocols: finalProtocols,
          },
        },
      };
    }),

  triggerViolation: (id) =>
    set((state) => {
      const activeTab = state.activeTab;
      const pool = state.pools[activeTab];
      return {
        pools: {
          ...state.pools,
          [activeTab]: {
            ...pool,
            protocols: pool.protocols.map((p) =>
              p.id === id ? { ...p, status: "violation" } : p
            ),
          },
        },
      };
    }),

  resetProtocols: () =>
    set((state) => {
      const activeTab = state.activeTab;
      const pool = state.pools[activeTab];
      const perProtocol = pool.totalDeposited / 3;
      return {
        pools: {
          ...state.pools,
          [activeTab]: {
            ...pool,
            protocols: pool.protocols.map((p) => ({
              ...p,
              status: "compliant",
              amount: perProtocol,
              allocation: 33.33,
            })),
          },
        },
        showAttestation: false,
      };
    }),

  setProtocols: (protocols) =>
    set((state) => {
      const activeTab = state.activeTab;
      return {
        pools: {
          ...state.pools,
          [activeTab]: {
            ...state.pools[activeTab],
            protocols,
          },
        },
      };
    }),

  addLog: (entry) =>
    set((state) => {
      const activeTab = state.activeTab;
      const pool = state.pools[activeTab];
      const newLog = { ...entry, id: generateId(), timestamp: new Date() };
      return {
        pools: {
          ...state.pools,
          [activeTab]: {
            ...pool,
            logs: [newLog, ...pool.logs].slice(0, 200),
          },
        },
      };
    }),

  clearLogs: () =>
    set((state) => {
      const activeTab = state.activeTab;
      return {
        pools: {
          ...state.pools,
          [activeTab]: {
            ...state.pools[activeTab],
            logs: [],
          },
        },
      };
    }),

  agentSpeed: 2000,
  setAgentSpeed: (ms) => set({ agentSpeed: ms }),
  isAgentRunning: false,
  setIsAgentRunning: (running) => set({ isAgentRunning: running }),

  showAttestation: false,
  attestationData: null,
  setAttestation: (data) =>
    set({ showAttestation: true, attestationData: data }),
  dismissAttestation: () =>
    set({ showAttestation: false, attestationData: null }),
}));
