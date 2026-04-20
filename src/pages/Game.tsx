import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, SkipForward } from "lucide-react";
import { useSocket } from "@/providers/socket";
import Canvas from "@/components/game/Canvas";
import Toolbar from "@/components/game/Toolbar";
import Chat from "@/components/game/Chat";
import GameInfo from "@/components/game/GameInfo";
import PlayerList from "@/components/game/PlayerList";
import WordSelector from "@/components/game/WordSelector";
import GameOver from "@/components/game/GameOver";
import CountdownOverlay from "@/components/game/CountdownOverlay";

export default function Game() {
  const navigate = useNavigate();
  const { roomCode, playerId, players, gameState, messages, wordOptions, leaderboard, socket,
    sendChat, chooseWord, nextRound, playAgain, drawStart, drawMove, drawEnd, clearCanvas, undoLastStroke } = useSocket();

  const [color, setColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [showWordSelector, setShowWordSelector] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const prevPhase = useRef(gameState.phase);

  const me = players.find((p) => p.id === playerId);
  const isHost = me?.isHost || false;
  const isDrawer = gameState.drawerId === playerId;
  const drawer = players.find((p) => p.id === gameState.drawerId);

  useEffect(() => { if (!roomCode) navigate("/"); }, [roomCode, navigate]);
  useEffect(() => { if (gameState.phase === "lobby" && roomCode) navigate("/lobby"); }, [gameState.phase, roomCode, navigate]);
  useEffect(() => { setShowWordSelector(gameState.phase === "choosing" && isDrawer && wordOptions.length > 0); }, [gameState.phase, isDrawer, wordOptions]);
  useEffect(() => {
    if (prevPhase.current !== "drawing" && gameState.phase === "drawing") { setShowCountdown(true); setDrawingEnabled(false); }
    if (["round_end", "game_over", "lobby"].includes(gameState.phase)) setDrawingEnabled(false);
    prevPhase.current = gameState.phase;
  }, [gameState.phase]);
  useEffect(() => { setShowGameOver(gameState.phase === "game_over"); }, [gameState.phase]);

  const onCountdownDone = useCallback(() => { setShowCountdown(false); setDrawingEnabled(true); }, []);
  const canDraw = isDrawer && drawingEnabled && gameState.phase === "drawing";

  if (!roomCode) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* top bar — 56px, glassmorphism */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-[rgba(10,10,15,0.8)] backdrop-blur-[12px] border-b border-[#1A1A23]">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#A1A1AA] transition-colors">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Leave
        </button>

        <GameInfo
          round={gameState.round} totalRounds={gameState.totalRounds}
          timeLeft={gameState.timeLeft} drawTime={gameState.drawTime}
          word={gameState.word} hint={gameState.hint}
          isDrawer={isDrawer} drawerName={drawer?.name || ""} phase={gameState.phase}
        />

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-[#3F3F46]">{roomCode}</span>
          {gameState.phase === "round_end" && isHost && (
            <button onClick={nextRound}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#3F3F46] text-xs text-[#A1A1AA] hover:text-white hover:border-[#52525B] transition-colors">
              <SkipForward className="w-3.5 h-3.5" strokeWidth={1.5} /> Next
            </button>
          )}
        </div>
      </div>

      {/* timer depletion line */}
      {gameState.phase === "drawing" && gameState.drawTime > 0 && (
        <div className="h-0.5 shrink-0 bg-[#1A1A23]">
          <div className={`h-full transition-all duration-1000 ease-linear ${gameState.timeLeft <= 10 ? "bg-[#EF4444]" : "bg-[#7C3AED]"}`}
            style={{ width: `${(gameState.timeLeft / gameState.drawTime) * 100}%` }} />
        </div>
      )}

      {/* main content */}
      <div className="flex-1 flex min-h-0">
        {/* canvas area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3 relative">
          {/* floating toolbar */}
          <Toolbar color={color} brushSize={brushSize} tool={tool}
            onColorChange={setColor} onBrushSizeChange={setBrushSize} onToolChange={setTool}
            onUndo={undoLastStroke} onClear={clearCanvas} isDrawer={canDraw} />

          {/* canvas 4:3 */}
          <div className="w-full max-w-[800px] aspect-[4/3]">
            <Canvas isDrawer={canDraw} color={color} brushSize={brushSize} tool={tool}
              onDrawStart={drawStart} onDrawMove={drawMove} onDrawEnd={drawEnd}
              socket={socket} gamePhase={gameState.phase} />
          </div>
        </div>

        {/* sidebar — 280px */}
        <div className="w-[280px] shrink-0 flex flex-col border-l border-[#1A1A23]">
          <PlayerList players={players} playerId={playerId} drawerId={gameState.drawerId} />
          <div className="flex-1 min-h-0">
            <Chat messages={messages} onSendMessage={sendChat} />
          </div>
        </div>
      </div>

      <CountdownOverlay isActive={showCountdown} onComplete={onCountdownDone} />
      <WordSelector wordOptions={wordOptions} onChooseWord={chooseWord} isOpen={showWordSelector} />
      <GameOver isOpen={showGameOver} winner={leaderboard[0] || null} leaderboard={leaderboard}
        onPlayAgain={() => { playAgain(); setShowGameOver(false); }} onHome={() => navigate("/")} isHost={isHost} />
    </div>
  );
}
