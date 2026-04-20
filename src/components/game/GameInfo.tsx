interface Props {
  round: number;
  totalRounds: number;
  timeLeft: number;
  drawTime: number;
  word: string | null;
  hint: string;
  isDrawer: boolean;
  drawerName: string;
  phase: string;
}

export default function GameInfo({ round, totalRounds, timeLeft, drawTime, word, hint, isDrawer, drawerName, phase }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center gap-12">
      {/* round */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#A1A1AA] uppercase tracking-wider">Round</span>
        <span className="text-sm font-medium text-white">{round}/{totalRounds}</span>
      </div>

      {/* word / hint */}
      <div className="flex items-center">
        {phase === "drawing" && isDrawer && word && (
          <span className="text-sm font-medium text-white tracking-widest uppercase">{word}</span>
        )}
        {phase === "drawing" && !isDrawer && (
          <span className="text-sm font-mono text-white tracking-[8px]">
            {hint ? hint.split(" ").map(char => char === "_" ? "_" : char).join("") : "..."}
          </span>
        )}
        {phase === "choosing" && (
          <span className="text-sm text-[#A1A1AA]">{isDrawer ? "Choose a word" : `${drawerName} is choosing`}</span>
        )}
        {phase === "round_end" && word && (
          <span className="text-sm text-[#A1A1AA]">Word was: <span className="font-medium text-white">{word}</span></span>
        )}
        {phase === "lobby" && <span className="text-sm text-[#52525B]">Waiting to start</span>}
      </div>

      {/* timer - number only since line is below top bar */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#A1A1AA] uppercase tracking-wider">Time</span>
        <span className={`text-sm font-mono tabular-nums ${timeLeft <= 10 && timeLeft > 0 ? "text-[#EF4444]" : "text-white"}`}>
          {timeLeft > 0 ? timeLeft : "--"}
        </span>
      </div>
    </div>
  );
}
