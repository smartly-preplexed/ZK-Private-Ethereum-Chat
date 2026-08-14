import { useState, useEffect, useCallback } from "react";
import { WalletProvider, useWallet } from "@/lib/wallet-context";
import { ChatProvider } from "@/lib/chat-context";
import { WalletBar } from "@/components/WalletBar";
import { ChatRoom } from "@/components/ChatRoom";
import { RoomList } from "@/components/RoomList";
import { ZKPPanel } from "@/components/ZKPPanel";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

function Shell() {
  const { address } = useWallet();
  const [activeRoom, setActiveRoom] = useState<string>("general");
  const [showZkp, setShowZkp] = useState(false);

  if (!address) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <div className="max-w-md text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-50">Connect to enter the secure channel</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              CipherChain uses zero-knowledge proofs to verify message validity without revealing content.
              Connect MetaMask to generate your ZKP credentials and join the conversation.
            </p>
            <WalletBar />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header onToggleZkp={() => setShowZkp((v) => !v)} />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-0 border-t border-slate-800/80">
        <RoomList activeRoom={activeRoom} onSelect={setActiveRoom} />
        <ChatRoom room={activeRoom} />
        {showZkp && <ZKPPanel />}
      </div>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <ChatProvider>
        <Shell />
      </ChatProvider>
    </WalletProvider>
  );
}