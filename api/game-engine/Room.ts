import { Player, type PlayerData } from "./Player";

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

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  isPrivate: false,
};

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

function makeRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export class Room {
  id: string;
  code: string;
  players = new Map<string, Player>();
  settings: RoomSettings;
  state: RoomState;
  messages: ChatMessage[] = [];
  strokes: Stroke[] = [];
  wordOptions: string[] = [];

  // callbacks for socket layer to broadcast events
  onTimerTick: ((timeLeft: number, hint: string) => void) | null = null;
  onRoundEnd: ((reason: string, word: string | null) => void) | null = null;

  private currentWord: string | null = null;
  private drawerIndex = -1;
  private guessedPlayers = new Set<string>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private hintCount = 0;
  private revealedChars = new Set<number>();

  constructor(hostName: string, hostSocketId: string, settings?: Partial<RoomSettings>) {
    this.id = uid();
    this.code = makeRoomCode();
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.state = {
      phase: "lobby",
      round: 0,
      totalRounds: this.settings.rounds,
      drawerId: null,
      word: null,
      hint: "",
      timeLeft: 0,
      drawTime: this.settings.drawTime,
    };

    const hostId = uid();
    const host = new Player(hostId, hostName, hostSocketId, `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostName}`, true);
    this.players.set(hostId, host);
  }

  // --- players ---

  addPlayer(name: string, socketId: string): Player {
    if (this.players.size >= this.settings.maxPlayers) throw new Error("Room is full");
    if (this.state.phase !== "lobby") throw new Error("Game already started");

    const id = uid();
    const player = new Player(id, name, socketId, `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${id}`, false);
    this.players.set(id, player);
    return player;
  }

  removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.isConnected = false;

    if (this.state.phase === "lobby") {
      this.players.delete(playerId);
      if (player.isHost && this.players.size > 0) {
        const next = this.players.values().next().value;
        if (next) next.isHost = true;
      }
    } else if (this.players.size === 1) {
      this.endGame();
    }
  }

  getPlayerBySocketId(socketId: string) {
    return Array.from(this.players.values()).find((p) => p.socketId === socketId);
  }

  getConnectedPlayers() {
    return Array.from(this.players.values()).filter((p) => p.isConnected);
  }

  getPlayersData(): PlayerData[] {
    return this.getConnectedPlayers().map((p) => p.toJSON());
  }

  // --- settings ---

  updateSettings(newSettings: Partial<RoomSettings>, playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player?.isHost || this.state.phase !== "lobby") return false;

    this.settings = { ...this.settings, ...newSettings };
    this.state.totalRounds = this.settings.rounds;
    this.state.drawTime = this.settings.drawTime;
    return true;
  }

  setReady(playerId: string, ready: boolean) {
    const player = this.players.get(playerId);
    if (player) player.isReady = ready;
  }

  // --- game flow ---

  startGame(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player?.isHost || this.getConnectedPlayers().length < 2) return false;

    this.state.phase = "choosing";
    this.state.round = 1;
    this.drawerIndex = -1;
    this.players.forEach((p) => p.resetForNewGame());
    this.startNewRound();
    return true;
  }

  private startNewRound() {
    const connected = this.getConnectedPlayers();
    if (connected.length === 0) return;

    this.drawerIndex = (this.drawerIndex + 1) % connected.length;
    const drawer = connected[this.drawerIndex];

    this.state.phase = "choosing";
    this.state.drawerId = drawer.id;
    this.state.word = null;
    this.state.hint = "";
    this.state.timeLeft = 0;
    this.currentWord = null;
    this.strokes = [];
    this.guessedPlayers = new Set();
    this.hintCount = 0;
    this.revealedChars = new Set();

    connected.forEach((p) => p.resetForNewRound());
    this.addSystemMessage(`${drawer.name} is choosing a word...`);
  }

  setWordOptions(options: string[]) {
    this.wordOptions = options;
  }

  chooseWord(word: string, playerId: string): boolean {
    if (this.state.drawerId !== playerId || this.state.phase !== "choosing") return false;

    this.currentWord = word.toLowerCase().trim();
    this.state.word = word;
    this.state.phase = "drawing";
    this.state.timeLeft = this.settings.drawTime;
    this.state.hint = this.buildHint();

    const drawer = this.players.get(playerId);
    this.addSystemMessage(`${drawer?.name} is drawing!`);
    this.startTimer();
    return true;
  }

  private buildHint(): string {
    if (!this.currentWord) return "";
    return this.currentWord
      .split("")
      .map((ch, i) => {
        if (ch === " ") return " ";
        if (this.revealedChars.has(i)) return ch.toUpperCase();
        return "_";
      })
      .join(" ");
  }

  private revealOneChar() {
    if (!this.currentWord) return;
    const hidden: number[] = [];
    this.currentWord.split("").forEach((ch, i) => {
      if (ch !== " " && !this.revealedChars.has(i)) hidden.push(i);
    });
    if (hidden.length === 0) return;

    this.revealedChars.add(hidden[Math.floor(Math.random() * hidden.length)]);
    this.state.hint = this.buildHint();
  }

  private startTimer() {
    this.clearTimer();
    this.timer = setInterval(() => {
      this.state.timeLeft--;

      // reveal hint letters at intervals
      if (this.settings.hints > 0 && this.currentWord) {
        const interval = Math.floor(this.settings.drawTime / (this.settings.hints + 1));
        const elapsed = this.settings.drawTime - this.state.timeLeft;
        if (elapsed > 0 && elapsed % interval === 0 && this.hintCount < this.settings.hints) {
          this.revealOneChar();
          this.hintCount++;
        }
      }

      this.onTimerTick?.(this.state.timeLeft, this.state.hint);

      if (this.state.timeLeft <= 0) this.endRound("timeout");
    }, 1000);
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // --- guessing ---

  makeGuess(playerId: string, text: string): { correct: boolean; points?: number; alreadyGuessed?: boolean } {
    const player = this.players.get(playerId);
    if (!player || !this.currentWord) return { correct: false };
    if (this.state.phase !== "drawing" || playerId === this.state.drawerId) return { correct: false };
    if (player.hasGuessedCorrectly) return { correct: false, alreadyGuessed: true };

    if (text.toLowerCase().trim() !== this.currentWord) return { correct: false };

    // correct guess!
    player.hasGuessedCorrectly = true;
    this.guessedPlayers.add(playerId);

    const timeBonus = Math.floor(this.state.timeLeft / 10);
    const points = Math.max(10, 50 + timeBonus);
    player.score += points;

    // reward the drawer too
    const drawer = this.players.get(this.state.drawerId!);
    if (drawer) drawer.score += Math.max(5, 25 + Math.floor(timeBonus / 2));

    // if everyone guessed, end early
    const nonDrawers = this.getConnectedPlayers().filter((p) => p.id !== this.state.drawerId);
    if (nonDrawers.length > 0 && nonDrawers.every((p) => p.hasGuessedCorrectly)) {
      this.endRound("all_guessed");
    }

    return { correct: true, points };
  }

  endRound(reason: "timeout" | "all_guessed" | "skipped") {
    this.clearTimer();
    this.state.phase = "round_end";
    if (this.currentWord) this.state.word = this.currentWord;

    if (reason === "timeout") this.addSystemMessage(`Time's up! The word was: ${this.currentWord}`);
    else if (reason === "all_guessed") this.addSystemMessage(`Everyone guessed it! The word was: ${this.currentWord}`);

    this.onRoundEnd?.(reason, this.currentWord);

    // check if game is over
    const connected = this.getConnectedPlayers();
    const lastRound = this.state.round >= this.settings.rounds;
    const lastDrawer = this.drawerIndex >= connected.length - 1;
    if (lastRound && lastDrawer) {
      setTimeout(() => { this.state.phase = "game_over"; }, 3000);
    }
  }

  nextRound() {
    if (this.state.phase === "game_over") return;

    const connected = this.getConnectedPlayers();
    if (this.drawerIndex >= connected.length - 1) {
      this.state.round++;
      this.drawerIndex = -1;
    }

    if (this.state.round > this.settings.rounds) {
      this.state.phase = "game_over";
      return;
    }

    this.startNewRound();
  }

  endGame() {
    this.clearTimer();
    this.state.phase = "game_over";
  }

  // --- canvas ---

  addStroke(s: Stroke) { this.strokes.push(s); }
  clearCanvas() { this.strokes = []; }
  undoLastStroke() { this.strokes.pop(); }

  // --- chat ---

  addChatMessage(playerId: string, playerName: string, text: string): ChatMessage {
    const msg: ChatMessage = { id: uid(), playerId, playerName, text, type: "chat", timestamp: Date.now() };
    this.messages.push(msg);
    if (this.messages.length > 200) this.messages = this.messages.slice(-200);
    return msg;
  }

  addCorrectGuessMessage(playerId: string, playerName: string, points: number): ChatMessage {
    const msg: ChatMessage = { id: uid(), playerId, playerName, text: `${playerName} guessed the word! (+${points} points)`, type: "correct_guess", timestamp: Date.now() };
    this.messages.push(msg);
    return msg;
  }

  addSystemMessage(text: string): ChatMessage {
    const msg: ChatMessage = { id: uid(), playerId: "system", playerName: "System", text, type: "system", timestamp: Date.now() };
    this.messages.push(msg);
    return msg;
  }

  // --- util ---

  getLeaderboard() {
    return this.getConnectedPlayers()
      .map((p) => ({ playerId: p.id, playerName: p.name, score: p.score, avatar: p.avatar }))
      .sort((a, b) => b.score - a.score);
  }

  getWinner() {
    const lb = this.getLeaderboard();
    return lb.length > 0 ? lb[0] : null;
  }

  getStateForPlayer(playerId: string): RoomState {
    const state = { ...this.state };
    // only the drawer sees the actual word
    if (state.phase === "drawing" && state.drawerId !== playerId) state.word = null;
    return state;
  }

  destroy() {
    this.clearTimer();
    this.players.clear();
    this.messages = [];
    this.strokes = [];
  }
}
