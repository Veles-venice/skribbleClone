import { Pencil } from "lucide-react";
import type { Player } from "@/types/game";

interface Props {
  players: Player[];
  playerId: string | null;
  drawerId: string | null;
}

export default function PlayerList({ players, playerId, drawerId }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="border-b border-[#1A1A23] p-4 flex-shrink-0 max-h-[300px] overflow-y-auto">
      <div className="flex flex-col gap-3">
        {sorted.map((player) => (
          <div key={player.id} className="flex items-center gap-3 h-8">
            <img src={player.avatar} alt="" className="w-8 h-8 rounded-full bg-[#1A1A23]" />
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 line-clamp-1">
                <span className={`text-sm ${player.id === playerId ? "font-medium text-white" : "text-[#A1A1AA]"}`}>
                  {player.name}
                </span>
                {player.id === drawerId && <Pencil className="w-3 h-3 text-[#A1A1AA]" strokeWidth={1.5} />}
              </div>
            </div>
            <span className={`text-sm font-mono ${player.hasGuessedCorrectly ? "text-[#22C55E] scale-105" : "text-[#52525B]"} transition-all duration-200`}>
              {player.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
