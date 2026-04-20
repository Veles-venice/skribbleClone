export interface Player {
  id: string;
  name: string;
  socketId: string;
  avatar: string;
  score: number;
  isHost: boolean;
  hasGuessedCorrectly: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  isPrivate: boolean;
}

export interface RoomState {
  phase: "lobby" | "choosing" | "drawing" | "round_end" | "game_over";
  round: number;
  totalRounds: number;
  drawerId: string | null;
  word: string | null;
  hint: string;
  timeLeft: number;
  drawTime: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: "chat" | "guess" | "correct_guess" | "system";
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  tool: "brush" | "eraser";
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  avatar: string;
}
