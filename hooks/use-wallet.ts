import { useStore } from "@/lib/store";

export function useWallet() {
  const isConnected = useStore((state) => state.walletConnected);
  const address = useStore((state) => state.walletAddress);
  const connect = useStore((state) => state.connectWallet);
  const disconnect = useStore((state) => state.disconnectWallet);

  return { isConnected, address, connect, disconnect };
}
