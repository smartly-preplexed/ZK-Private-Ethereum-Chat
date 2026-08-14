import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet-context";
import { Loader2 } from "lucide-react";

export function WalletBar() {
  const { address, connect, disconnect, connecting } = useWallet();

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-mono text-slate-200">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={disconnect} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} disabled={connecting} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold">
      {connecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting…
        </>
      ) : (
        "Connect MetaMask"
      )}
    </Button>
  );
}