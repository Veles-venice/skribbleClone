export interface PlayerData {
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

export class Player {
  id: string;
  name: string;
  socketId: string;
  avatar: string;
  score = 0;
  isHost: boolean;
  hasGuessedCorrectly = false;
  isReady = false;
  isConnected = true;

  constructor(id: string, name: string, socketId: string, avatar: string, isHost: boolean) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.avatar = avatar;
    this.isHost = isHost;
  }

  resetForNewGame() {
    this.score = 0;
    this.hasGuessedCorrectly = false;
    this.isReady = false;
  }

  resetForNewRound() {
    this.hasGuessedCorrectly = false;
  }

  toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      socketId: this.socketId,
      avatar: this.avatar,
      score: this.score,
      isHost: this.isHost,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      isReady: this.isReady,
      isConnected: this.isConnected,
    };
  }
}
