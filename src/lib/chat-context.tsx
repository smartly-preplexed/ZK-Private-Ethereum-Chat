import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  sender: string;
  ciphertext: string;
  plaintext: string;
  timestamp: number;
  room: string;
  txHash: string;
  proofHash: string;
  status: "pending" | "confirmed" | "failed";
}

export interface Room {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  unread: number;
}

interface ChatState {
  rooms: Room[];
  messages: Record<string, ChatMessage[]>;
  presence: Record<string, boolean>;
  sendMessage: (room: string, text: string) => Promise<void>;
  loadMore: (room: string) => void;
  hasMore: (room: string) => boolean;
  loading: boolean;
}

const ChatContext = createContext<ChatState | undefined>(undefined);

const ROOMS: Room[] = [
  { id: "general", name: "# general", description: "Open discussion for all members", memberCount: 42, unread: 0 },
  { id: "engineering", name: "# engineering", description: "Protocol & contract development", memberCount: 18, unread: 3 },
  { id: "research", name: "# research", description: "ZKP cryptography research", memberCount: 11, unread: 1 },
  { id: "ops", name: "# ops", description: "Admin & moderation coordination", memberCount: 6, unread: 0 },
];

const SEED_MESSAGES: Record<string, Omit<ChatMessage, "room">[]> = {
  general: [
    { id: "m1", sender: "0x4f2b…91a3", ciphertext: "0x8af3…c21e", plaintext: "Welcome to CipherChain. All messages are verified via ZKP before posting.", timestamp: Date.now() - 3600000 * 5, txHash: "0xa1b2…f3e4", proofHash: "0x9c8d…1a2b", status: "confirmed" },
    { id: "m2", sender: "0x7d1e…44c9", ciphertext: "0x3b21…9e0f", plaintext: "Gas costs are down 30% after the batched proof optimization.", timestamp: Date.now() - 3600000 * 3, txHash: "0xc3d4…e5f6", proofHash: "0x2f3a…4b5c", status: "confirmed" },
    { id: "m3", sender: "0x9a8b…2d7f", ciphertext: "0x6e5f…a1b2", plaintext: "Anyone have the verifier contract ABI for the new circuit?", timestamp: Date.now() - 3600000 * 1, txHash: "0x7e8f…0a1b", proofHash: "0x6d7e…8f9a", status: "confirmed" },
  ],
  engineering: [
    { id: "m4", sender: "0x4f2b…91a3", ciphertext: "0x1a2b…3c4d", plaintext: "Pushed the Groth16 verifier gas optimization — 210k → 148k per proof.", timestamp: Date.now() - 7200000, txHash: "0xb2c3…d4e5", proofHash: "0x5a6b…7c8d", status: "confirmed" },
    { id: "m5", sender: "0x3c5d…8e9f", ciphertext: "0x7f8a…9b0c", plaintext: "Need to audit the message hash preimage check before mainnet.", timestamp: Date.now() - 1800000, txHash: "0xd4e5…f6a7", proofHash: "0x8b9c…0d1e", status: "confirmed" },
  ],
  research: [
    { id: "m6", sender: "0x2b3c…4d5e", ciphertext: "0xa1b2…c3d4", plaintext: "New PLONK circuit reduces proof size to 184 bytes. Testing verification now.", timestamp: Date.now() - 5400000, txHash: "0xe5f6…a7b8", proofHash: "0x1c2d…3e4f", status: "confirmed" },
  ],
  ops: [],
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const init: Record<string, ChatMessage[]> = {};
    for (const r of ROOMS) {
      init[r.id] = (SEED_MESSAGES[r.id] ?? []).map((m) => ({ ...m, room: r.id }));
    }
    return init;
  });
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [pageMap, setPageMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!address) return;
    setPresence((p) => ({ ...p, [address]: true }));
    const interval = setInterval(() => {
      // simulate presence heartbeat
      setPresence((p) => ({ ...p, [address]: true }));
    }, 15000);
    return () => clearInterval(interval);
  }, [address]);

  const sendMessage = useCallback(async (room: string, text: string) => {
    if (!address) return;
    if (!text.trim()) return;
    const tempId = `pending-${Date.now()}`;
    const ciphertext = `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`;
    const proofHash = `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`;
    const txHash = `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`;

    const pendingMsg: ChatMessage = {
      id: tempId,
      sender: address,
      ciphertext,
      plaintext: text,
      timestamp: Date.now(),
      room,
      txHash,
      proofHash,
      status: "pending",
    };

    setMessages((prev) => ({ ...prev, [room]: [...(prev[room] ?? []), pendingMsg] }));

    try {
      // Simulate ZKP generation + on-chain tx
      await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

      // Simulate rare ZKP failure (5%)
      if (Math.random() < 0.05) {
        throw new Error("ZKP verification failed: invalid proof witness");
      }

      setMessages((prev) => ({
        ...prev,
        [room]: (prev[room] ?? []).map((m) =>
          m.id === tempId ? { ...m, status: "confirmed", txHash: `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}` } : m
        ),
      }));
      toast.success("Message posted on-chain", { description: `Proof verified · gas 142k` });
    } catch (err: any) {
      setMessages((prev) => ({
        ...prev,
        [room]: (prev[room] ?? []).map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      }));
      toast.error("Transaction failed", { description: err?.message ?? "ZKP rejected by verifier" });
    }
  }, [address]);

  const loadMore = useCallback((room: string) => {
    setLoading(true);
    setTimeout(() => {
      const page = (pageMap[room] ?? 1) + 1;
      setPageMap((p) => ({ ...p, [room]: page }));
      const older: ChatMessage[] = Array.from({ length: 3 }, (_, i) => ({
        id: `old-${room}-${page}-${i}`,
        sender: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 4)}`,
        ciphertext: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
        plaintext: `Historical message ${page}-${i + 1} from the archived on-chain log.`,
        timestamp: Date.now() - 86400000 * page - i * 3600000,
        room,
        txHash: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
        proofHash: `0x${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
        status: "confirmed" as const,
      }));
      setMessages((prev) => ({ ...prev, [room]: [...older, ...(prev[room] ?? [])] }));
      setLoading(false);
    }, 600);
  }, [pageMap]);

  const hasMore = useCallback((room: string) => (pageMap[room] ?? 1) < 5, [pageMap]);

  return (
    <ChatContext.Provider value={{ rooms: ROOMS, messages, presence, sendMessage, loadMore, hasMore, loading }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}