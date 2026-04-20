import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { useSocket } from "@/providers/socket";
import { toast } from "sonner";

export default function Lobby() {
  const navigate = useNavigate();
  const { roomCode, playerId, players, settings, gameState, setReady, startGame } = useSocket();
  const [copied, setCopied] = useState(false);

  const me = players.find((p) => p.id === playerId);
  const isHost = me?.isHost || false;
  const allReady = players.filter((p) => !p.isHost).every((p) => p.isReady);
  const canStart = isHost && players.length >= 2 && (players.length === 2 || allReady);

  useEffect(() => { if (!roomCode) navigate("/"); }, [roomCode, navigate]);
  useEffect(() => {
    if (gameState.phase === "choosing" || gameState.phase === "drawing") navigate("/game");
  }, [gameState.phase, navigate]);

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true); toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!roomCode) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* back */}
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#A1A1AA] mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Back
        </button>

        {/* room code */}
        <div className="mb-12">
          <p className="text-xs text-[#52525B] uppercase tracking-wider mb-3">Room Code</p>
          <button onClick={copyCode}
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#12121A] border border-[#27272A] hover:border-[#3F3F46] transition-colors">
            <span className="text-xl font-mono font-semibold tracking-[0.25em] text-white">{roomCode}</span>
            {copied
              ? <Check className="w-4 h-4 text-[#22C55E]" strokeWidth={1.5} />
              : <Copy className="w-4 h-4 text-[#52525B]" strokeWidth={1.5} />}
          </button>
        </div>

        {/* players */}
        <div className="mb-8">
          <p className="text-xs text-[#52525B] mb-4">{players.length} / {settings.maxPlayers} players</p>
          <div className="space-y-1">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 h-12 px-3 rounded-lg hover:bg-[#12121A] transition-colors">
                <img src={player.avatar} alt="" className="w-8 h-8 rounded-full bg-[#1A1A23]" />
                <span className="flex-1 text-sm text-white truncate">
                  {player.name}
                  {player.id === playerId && <span className="text-[#52525B] ml-1">(you)</span>}
                </span>
                {player.isHost ? (
                  <span className="text-xs text-[#52525B]">Host</span>
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${player.isReady ? "bg-[#22C55E]" : "bg-[#3F3F46]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* actions */}
        <div className="space-y-3">
          {isHost ? (
            <button onClick={() => startGame()} disabled={!canStart}
              className="w-full h-10 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-20 text-sm font-medium text-white transition-colors duration-150">
              Start Game
            </button>
          ) : (
            <button onClick={() => setReady(!me?.isReady)}
              className={`w-full h-10 rounded-lg text-sm font-medium transition-colors duration-150 ${
                me?.isReady
                  ? "border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/5"
                  : "bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
              }`}>
              {me?.isReady ? "Ready" : "Ready Up"}
            </button>
          )}
        </div>

        <div className="mt-8 flex gap-6 text-[11px] text-[#3F3F46]">
          <span>{settings.rounds} rounds</span>
          <span>{settings.drawTime}s draw time</span>
          <span>{settings.hints} hints</span>
        </div>
      </div>
    </div>
  );
}
