import { useChat } from "@/lib/chat-context";
import { useWallet } from "@/lib/wallet-context";
import { cn } from "@/lib/utils";
import { Hash, Lock, Users } from "lucide-react";

interface RoomListProps {
  activeRoom: string;
  onSelect: (id: string) => void;
}

export function RoomList({ activeRoom, onSelect }: RoomListProps) {
  const { rooms, messages, presence } = useChat();
  const { address } = useWallet();
  const onlineCount = Object.values(presence).filter(Boolean).length;

  return (
    <aside className="border-r border-slate-800/80 bg-slate-900/40 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Channels</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {onlineCount} online
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {rooms.map((room) => {
          const count = messages[room.id]?.length ?? 0;
          const isActive = room.id === activeRoom;
          return (
            <button
              key={room.id}
              onClick={() => onSelect(room.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg transition-all group",
                isActive ? "bg-emerald-500/10 border border-emerald-500/30" : "border border-transparent hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Hash className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-400" : "text-slate-500")} />
                  <span className={cn("text-sm font-medium truncate", isActive ? "text-emerald-100" : "text-slate-300")}>
                    {room.name.replace("# ", "")}
                  </span>
                </div>
                {room.unread > 0 && (
                  <span className="ml-2 shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-bold text-slate-950">
                    {room.unread}
                  </span>
                )}
              </div>
              <p className="mt-1 pl-6 text-xs text-slate-500 truncate">{room.description}</p>
              <div className="mt-1.5 pl-6 flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {room.memberCount}
                </span>
                <span>{count} msgs</span>
                {room.id === "ops" && (
                  <span className="flex items-center gap-1 text-amber-500/70">
                    <Lock className="w-3 h-3" />
                    admin
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
      {address && (
        <div className="px-4 py-3 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-400 font-mono">{address.slice(0, 10)}…</span>
          </div>
        </div>
      )}
    </aside>
  );
}