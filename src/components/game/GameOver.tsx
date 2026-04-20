import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LeaderboardEntry } from "@/types/game";

interface Props {
  isOpen: boolean;
  winner: LeaderboardEntry | null;
  leaderboard: LeaderboardEntry[];
  onPlayAgain: () => void;
  onHome: () => void;
  isHost: boolean;
}

export default function GameOver({ isOpen, winner, leaderboard, onPlayAgain, onHome, isHost }: Props) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-sm bg-[#12121A] border border-[#27272A] p-0 shadow-none" showCloseButton={false}>
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-base font-semibold text-white">Game Over</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mb-6">
            {leaderboard.map((entry, i) => (
              <div key={entry.playerId}
                className={`flex items-center gap-3 px-3 h-10 rounded-lg ${
                  i === 0 ? "bg-[#1A1A23] border border-[#27272A]" : ""
                }`}>
                <span className="w-4 text-xs font-mono text-[#52525B]">{i + 1}</span>
                <span className="flex-1 text-sm text-white">{entry.playerName}</span>
                <span className="text-sm font-mono text-[#A1A1AA]">{entry.score} pts</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {isHost && (
              <button onClick={onPlayAgain}
                className="flex-1 h-10 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-sm font-medium transition-colors">
                Play Again
              </button>
            )}
            <button onClick={onHome}
              className={`${isHost ? "flex-1" : "w-full"} h-10 rounded-lg border border-[#3F3F46] text-[#A1A1AA] hover:text-white hover:border-[#52525B] text-sm font-medium transition-colors`}>
              Leave Room
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
