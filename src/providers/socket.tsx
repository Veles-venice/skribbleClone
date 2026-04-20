import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import type { Player, RoomSettings, RoomState, ChatMessage, LeaderboardEntry } from "@/types/game";

interface SocketContextValue {
  socket: React.RefObject<Socket | null>;
  isConnected: boolean;
  roomId: string | null;
  roomCode: string | null;
  playerId: string | null;
  players: Player[];
  settings: RoomSettings;
  gameState: RoomState;
  messages: ChatMessage[];
  wordOptions: string[];
  leaderboard: LeaderboardEntry[];
  error: string | null;
  createRoom: (hostName: string, roomSettings?: Partial<RoomSettings>) => Promise<boolean>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  updateSettings: (s: Partial<RoomSettings>) => void;
  setReady: (ready: boolean) => void;
  startGame: () => Promise<boolean>;
  chooseWord: (word: string) => Promise<boolean>;
  sendChat: (text: string) => void;
  nextRound: () => void;
  playAgain: () => void;
  endGame: () => void;
  drawStart: (x: number, y: number, color: string, size: number, tool: "brush" | "eraser") => void;
  drawMove: (x: number, y: number) => void;
  drawEnd: () => void;
  clearCanvas: () => void;
  undoLastStroke: () => void;
}

const defaults = {
  settings: { maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hints: 2, isPrivate: false } as RoomSettings,
  gameState: { phase: "lobby", round: 0, totalRounds: 3, drawerId: null, word: null, hint: "", timeLeft: 0, drawTime: 80 } as RoomState,
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings>(defaults.settings);
  const [gameState, setGameState] = useState<RoomState>(defaults.gameState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // refs so callbacks don't go stale
  const roomIdRef = useRef(roomId);
  const playerIdRef = useRef(playerId);
  roomIdRef.current = roomId;
  playerIdRef.current = playerId;

  // one socket connection for the whole app
  useEffect(() => {
    
    const socket = io(import.meta.env.VITE_API_URL, {
  path: "/socket.io",
  transports: ["websocket"]
});
    socketRef.current = socket;

    socket.on("connect", () => { setIsConnected(true); setError(null); });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", () => setError("Connection failed. Retrying..."));

    // room events
    socket.on("player_joined", ({ players }) => setPlayers(players));
    socket.on("player_left", ({ players }) => setPlayers(players));
    socket.on("player_disconnected", ({ players }) => setPlayers(players));
    socket.on("player_ready", ({ players }) => setPlayers(players));
    socket.on("settings_updated", ({ settings }) => setSettings(settings));

    // game events
    socket.on("game_state", ({ state, players }) => { setGameState(state); setPlayers(players); });

    socket.on("round_start", (data: any) => {
      if (data.state) setGameState(data.state);
      if (data.players) setPlayers(data.players);
      if (data.wordOptions) setWordOptions(data.wordOptions);
    });

    socket.on("word_chosen", ({ state }: any) => { setGameState(state); setWordOptions([]); });

    socket.on("round_end", ({ scores, state, players }: any) => {
      setGameState(state);
      setLeaderboard(scores);
      setPlayers(players);
    });

    socket.on("game_over", ({ leaderboard, players, state }: any) => {
      setGameState(state);
      setLeaderboard(leaderboard);
      setPlayers(players);
    });

    socket.on("game_reset", ({ state, players }: any) => {
      setGameState(state);
      setPlayers(players);
      setMessages([]);
      setLeaderboard([]);
      setWordOptions([]);
    });

    // timer — only update timeLeft and hint to avoid wiping canvas
    socket.on("timer_tick", ({ timeLeft, hint }: any) => {
      setGameState((prev) => {
        if (prev.timeLeft === timeLeft && prev.hint === hint) return prev;
        return { ...prev, timeLeft, hint };
      });
    });

    // drawing events are handled directly by Canvas via socket ref
    socket.on("draw_data", () => {});
    socket.on("draw_move", () => {});
    socket.on("draw_end", () => {});
    socket.on("canvas_clear", () => {});
    socket.on("draw_undo", () => {});

    // chat
    socket.on("chat_message", (msg: ChatMessage) => setMessages((prev) => [...prev, msg]));

    socket.on("guess_result", (data: any) => {
      if (data.correct) {
        if (data.players) setPlayers(data.players);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  // helper to emit events
  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const createRoom = useCallback((hostName: string, roomSettings?: Partial<RoomSettings>): Promise<boolean> => {
    return new Promise((resolve) => {
      socketRef.current?.emit("create_room", { hostName, settings: roomSettings }, (res: any) => {
        if (res.success) {
          setRoomId(res.roomId); setRoomCode(res.roomCode); setPlayerId(res.playerId);
          setPlayers(res.players || []);
          if (res.settings) setSettings(res.settings);
          if (res.state) setGameState(res.state);
          setError(null);
          resolve(true);
        } else { setError(res.error || "Failed to create room"); resolve(false); }
      });
    });
  }, []);

  const joinRoom = useCallback((code: string, playerName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      socketRef.current?.emit("join_room", { roomCode: code, playerName }, (res: any) => {
        if (res.success) {
          setRoomId(res.roomId); setRoomCode(res.roomCode); setPlayerId(res.playerId);
          setPlayers(res.players || []);
          if (res.settings) setSettings(res.settings);
          if (res.state) setGameState(res.state);
          if (res.messages) setMessages(res.messages);
          setError(null);
          resolve(true);
        } else { setError(res.error || "Failed to join room"); resolve(false); }
      });
    });
  }, []);

  const updateSettings = useCallback((s: Partial<RoomSettings>) => emit("update_settings", { roomId: roomIdRef.current, settings: s, playerId: playerIdRef.current }), [emit]);
  const setReady = useCallback((ready: boolean) => emit("set_ready", { roomId: roomIdRef.current, playerId: playerIdRef.current, ready }), [emit]);

  const startGame = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      socketRef.current?.emit("start_game", { roomId: roomIdRef.current, playerId: playerIdRef.current }, (res: any) => resolve(res.success));
    });
  }, []);

  const chooseWord = useCallback((word: string): Promise<boolean> => {
    return new Promise((resolve) => {
      socketRef.current?.emit("choose_word", { roomId: roomIdRef.current, playerId: playerIdRef.current, word }, (res: any) => resolve(res.success));
    });
  }, []);

  const sendChat = useCallback((text: string) => emit("chat", { roomId: roomIdRef.current, playerId: playerIdRef.current, text }), [emit]);
  const nextRound = useCallback(() => emit("next_round", { roomId: roomIdRef.current, playerId: playerIdRef.current }), [emit]);
  const playAgain = useCallback(() => emit("play_again", { roomId: roomIdRef.current, playerId: playerIdRef.current }), [emit]);
  const endGame = useCallback(() => emit("end_game", { roomId: roomIdRef.current, playerId: playerIdRef.current }), [emit]);

  const drawStart = useCallback((x: number, y: number, color: string, size: number, tool: "brush" | "eraser") =>
    emit("draw_start", { roomId: roomIdRef.current, playerId: playerIdRef.current, x, y, color, size, tool }), [emit]);
  const drawMove = useCallback((x: number, y: number) =>
    emit("draw_move", { roomId: roomIdRef.current, playerId: playerIdRef.current, x, y }), [emit]);
  const drawEnd = useCallback(() =>
    emit("draw_end", { roomId: roomIdRef.current, playerId: playerIdRef.current }), [emit]);
  const clearCanvas = useCallback(() =>
    emit("canvas_clear", { roomId: roomIdRef.current, playerId: playerIdRef.current }), [emit]);
  const undoLastStroke = useCallback(() =>
    emit("draw_undo", { roomId: roomIdRef.current, playerId: playerIdRef.current }), [emit]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef, isConnected, roomId, roomCode, playerId, players, settings,
      gameState, messages, wordOptions, leaderboard, error,
      createRoom, joinRoom, updateSettings, setReady, startGame, chooseWord,
      sendChat, nextRound, playAgain, endGame,
      drawStart, drawMove, drawEnd, clearCanvas, undoLastStroke,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be inside SocketProvider");
  return ctx;
}
