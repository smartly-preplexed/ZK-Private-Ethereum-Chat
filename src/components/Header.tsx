import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet-context";
import { WalletBar } from "@/components/WalletBar";
import { Shield } from "lucide-react";

interface HeaderProps {
  onToggleZkp?: () => void;
}

export function Header({ onToggleZkp }: HeaderProps) {
  const { address } = useWallet();
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-slate-50 leading-tight">CipherChain</h1>
            <p className="text-xs text-slate-500 leading-tight">ZK-verified team chat · Hardhat</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {address && onToggleZkp && (
            <Button variant="outline" size="sm" onClick={onToggleZkp} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100">
              ZKP Console
            </Button>
          )}
          <WalletBar />
        </div>
      </div>
    </header>
  );
}