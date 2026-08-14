import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "sonner";

interface WalletState {
  address: string | null;
  chainId: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

const CHAIN_ID = "0x7a69"; // 31337 local hardhat

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const syncAccount = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAddress(null);
      toast.error("Wallet disconnected");
    } else {
      setAddress(accounts[0]);
      toast.success("Wallet connected", { description: `${accounts[0].slice(0, 8)}…${accounts[0].slice(-6)}` });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
      if (accs.length) syncAccount(accs);
    }).catch(() => {});
    const handler = (accounts: string[]) => syncAccount(accounts);
    const chainHandler = (cid: string) => setChainId(cid);
    eth.on?.("accountsChanged", handler);
    eth.on?.("chainChanged", chainHandler);
    return () => {
      eth.removeListener?.("accountsChanged", handler);
      eth.removeListener?.("chainChanged", chainHandler);
    };
  }, [syncAccount]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) {
      toast.error("MetaMask not found", { description: "Install MetaMask to continue" });
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      syncAccount(accounts);
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID }] });
      } catch {
        // ignore chain switch failure for demo
      }
    } catch (err: any) {
      toast.error("Connection rejected", { description: err?.message ?? "User denied request" });
    } finally {
      setConnecting(false);
    }
  }, [syncAccount]);

  const disconnect = useCallback(() => {
    setAddress(null);
    toast.info("Wallet disconnected");
  }, []);

  return (
    <WalletContext.Provider value={{ address, chainId, connecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}