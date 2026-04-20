import { Room } from "./Room";

export class GameManager {
  private static instance: GameManager;
  private rooms = new Map<string, Room>();
  private codeToRoom = new Map<string, string>();

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) GameManager.instance = new GameManager();
    return GameManager.instance;
  }

  createRoom(hostName: string, hostSocketId: string, settings?: Partial<{ maxPlayers: number; rounds: number; drawTime: number; wordCount: number; hints: number; isPrivate: boolean }>): Room {
    const room = new Room(hostName, hostSocketId, settings);
    this.rooms.set(room.id, room);
    this.codeToRoom.set(room.code, room.id);
    return room;
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): Room | undefined {
    const roomId = this.codeToRoom.get(code.toUpperCase());
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  removeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.rooms.delete(roomId);
      this.codeToRoom.delete(room.code);
    }
  }

  cleanup() {
    const toRemove: string[] = [];
    this.rooms.forEach((room, id) => {
      if (room.getConnectedPlayers().length === 0) toRemove.push(id);
    });
    toRemove.forEach((id) => this.removeRoom(id));
  }
}
