import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, ChatMessage } from "@/lib/chat-context";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Send, ArrowDown, Loader2, AlertTriangle, CheckCircle2, Clock, Shield, Eye, EyeOff } from "lucide-react";

interface ChatRoomProps {
  room: string;
}

export function ChatRoom({ room }: ChatRoomProps) {
  const { messages, sendMessage, loadMore, hasMore, loading } = useChat();
  const { address } = useWallet();
  const [input, setInput] = useState("");
  const [showCipher, setShowCipher] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const roomMessages = messages[room] ?? [];

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [roomMessages.length, atBottom, scrollToBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (input.length > 280) {
      toast.error("Message too long", { description: "Max 280 chars to minimize on-chain calldata" });
      return;
    }
    const text = input;
    setInput("");
    setAtBottom(true);
    await sendMessage(room, text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="flex flex-col bg-slate-950 min-w-0">
      {/* Room header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/30">
        <div>
          <h2 className="text-base font-serif font-bold text-slate-100">
            #{room}
          </h2>
          <p className="text-xs text-slate-500">
            {roomMessages.length} messages · end-to-end encrypted · ZK-verified
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCipher((v) => !v)}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
          >
            {showCipher ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
            {showCipher ? "Show plaintext" : "Show ciphertext"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {hasMore(room) && (
          <div className="flex justify-center pb-3">
            <Button variant="ghost" size="sm" onClick={() => loadMore(room)} disabled={loading} className="text-slate-500 hover:text-slate-300 text-xs">
              {loading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
              Load older messages
            </Button>
          </div>
        )}
        {roomMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">No messages yet in #{room}</p>
            <p className="text-xs text-slate-600 mt-1">Be the first to post a ZK-verified message</p>
          </div>
        )}
        {roomMessages.map((msg, idx) => (
          <MessageRow key={msg.id} msg={msg} showCipher={showCipher} prev={roomMessages[idx - 1]} isOwn={msg.sender === address} />
        ))}
      </div>

      {/* Scroll to bottom */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 z-10 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-700 transition"
        >
          <ArrowDown className="w-4 h-4 text-slate-300" />
        </button>
      )}

      {/* Composer */}
      <div className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Message #${room}…  (Enter to send · Shift+Enter for newline)`}
            maxLength={280}
            className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-600 resize-none pr-24 min-h-[48px] focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
            rows={1}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-600">{input.length}/280</span>
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="sm"
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Sign & Send
            </Button>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
          <Shield className="w-3 h-3 text-emerald-500/60" />
          Messages are encrypted client-side and verified via Groth16 proof before posting on-chain
        </p>
      </div>
    </section>
  );
}

function MessageRow({ msg, showCipher, prev, isOwn }: { msg: ChatMessage; showCipher: boolean; prev?: ChatMessage; isOwn: boolean }) {
  const grouped = prev && prev.sender === msg.sender && msg.timestamp - prev.timestamp < 60000;
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn("flex gap-3 group", grouped ? "mt-0.5" : "mt-4")}>
      {/* Avatar */}
      <div className="w-9 shrink-0">
        {!grouped && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold", isOwn ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400 border border-slate-700")}>
            {msg.sender.slice(2, 4).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={cn("text-sm font-semibold", isOwn ? "text-emerald-300" : "text-slate-200")}>
              {isOwn ? "You" : msg.sender}
            </span>
            <span className="text-xs text-slate-600">{time}</span>
            {msg.status === "confirmed" && (
              <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
            )}
            {msg.status === "pending" && (
              <Clock className="w-3 h-3 text-amber-500/70 animate-pulse" />
            )}
            {msg.status === "failed" && (
              <AlertTriangle className="w-3 h-3 text-red-500/80" />
            )}
          </div>
        )}
        <div className={cn(
          "inline-block rounded-xl px-3.5 py-2 text-sm leading-relaxed",
          msg.status === "failed" ? "bg-red-950/40 border border-red-900/50 text-red-300" : isOwn ? "bg-emerald-500/10 border border-emerald-500/20 text-slate-100" : "bg-slate-800/50 border border-slate-700/60 text-slate-200"
        )}>
          {showCipher ? (
            <span className="font-mono text-xs text-slate-500 break-all">{msg.ciphertext}</span>
          ) : (
            msg.plaintext
          )}
        </div>
        {/* Meta row */}
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500/40" />
            proof: {msg.proofHash}
          </span>
          <span className="font-mono">tx: {msg.txHash}</span>
          {msg.status === "failed" && <span className="text-red-500/80">ZKP rejected — message not posted</span>}
        </div>
      </div>
    </div>
  );
}