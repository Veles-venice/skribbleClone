import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { GameManager } from "./game-engine/GameManager";
import { getRandomWords } from "./game-engine/wordBank";
import type { Stroke } from "./game-engine/Room";

let io: SocketServer | null = null;

export function initSocketIO(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  const gameManager = GameManager.getInstance();

  // wire up timer + round-end broadcasting on a room
  function setupRoomCallbacks(room: ReturnType<typeof gameManager.createRoom>) {
    room.onTimerTick = (timeLeft, hint) => {
      room.getConnectedPlayers().forEach((player) => {
        io?.to(player.socketId).emit("timer_tick", {
          timeLeft,
          hint,
          state: room.getStateForPlayer(player.id),
        });
      });
    };

    room.onRoundEnd = (reason, word) => {
      io?.to(room.id).emit("round_end", {
        word,
        reason,
        scores: room.getLeaderboard(),
        players: room.getPlayersData(),
        state: room.state,
      });
    };
  }

  // cleanup empty rooms every 5 min
  setInterval(() => gameManager.cleanup(), 5 * 60 * 1000);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- CREATE ROOM ---
    socket.on("create_room", ({ hostName, settings }, callback) => {
      try {
        const room = gameManager.createRoom(hostName, socket.id, settings);
        socket.join(room.id);
        setupRoomCallbacks(room);

        const player = room.getPlayerBySocketId(socket.id);
        if (!player) throw new Error("Failed to create player");

        callback({
          success: true,
          roomId: room.id,
          roomCode: room.code,
          playerId: player.id,
          players: room.getPlayersData(),
          settings: room.settings,
          state: room.state,
        });
        console.log(`Room created: ${room.code} by ${hostName}`);
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    // --- JOIN ROOM ---
    socket.on("join_room", ({ roomCode, playerName }, callback) => {
      try {
        const room = gameManager.getRoomByCode(roomCode);
        if (!room) throw new Error("Room not found");

        const player = room.addPlayer(playerName, socket.id);
        socket.join(room.id);

        if (!room.onTimerTick) setupRoomCallbacks(room);

        socket.to(room.id).emit("player_joined", { players: room.getPlayersData() });

        callback({
          success: true,
          roomId: room.id,
          roomCode: room.code,
          playerId: player.id,
          players: room.getPlayersData(),
          settings: room.settings,
          state: room.state,
          messages: room.messages,
        });
        console.log(`${playerName} joined room ${roomCode}`);
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    // --- SETTINGS ---
    socket.on("update_settings", ({ roomId, settings, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return;
      if (room.updateSettings(settings, playerId)) {
        io?.to(roomId).emit("settings_updated", { settings: room.settings });
      }
    });

    // --- READY UP ---
    socket.on("set_ready", ({ roomId, playerId, ready }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return;
      room.setReady(playerId, ready);
      io?.to(roomId).emit("player_ready", { playerId, ready, players: room.getPlayersData() });
    });

    // --- START GAME ---
    socket.on("start_game", ({ roomId, playerId }, callback) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return callback?.({ success: false, error: "Room not found" });

      if (!room.onTimerTick) setupRoomCallbacks(room);

      if (!room.startGame(playerId)) {
        return callback?.({ success: false, error: "Cannot start game" });
      }

      const words = getRandomWords(room.settings.wordCount);
      room.setWordOptions(words);
      const drawer = room.players.get(room.state.drawerId!);

      // send game state to everyone
      room.getConnectedPlayers().forEach((player) => {
        io?.to(player.socketId).emit("game_state", {
          state: room.getStateForPlayer(player.id),
          players: room.getPlayersData(),
        });
      });

      // send word choices to drawer
      if (drawer) {
        io?.to(drawer.socketId).emit("round_start", {
          drawerId: room.state.drawerId,
          wordOptions: words,
          drawTime: room.settings.drawTime,
        });
      }

      // tell everyone else who's drawing
      socket.to(roomId).emit("round_start", {
        drawerId: room.state.drawerId,
        wordOptions: [],
        drawTime: room.settings.drawTime,
      });

      callback?.({ success: true });
    });

    // --- CHOOSE WORD ---
    socket.on("choose_word", ({ roomId, playerId, word }, callback) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return callback?.({ success: false });

      if (!room.onTimerTick) setupRoomCallbacks(room);

      if (!room.chooseWord(word, playerId)) {
        return callback?.({ success: false });
      }

      const drawer = room.players.get(playerId);
      room.getConnectedPlayers().forEach((player) => {
        io?.to(player.socketId).emit("word_chosen", {
          state: room.getStateForPlayer(player.id),
          drawerName: drawer?.name || "",
        });
      });

      callback?.({ success: true });
    });

    // --- DRAWING ---
    socket.on("draw_start", ({ roomId, playerId, x, y, color, size, tool }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room || room.state.drawerId !== playerId || room.state.phase !== "drawing") return;

      const stroke: Stroke = {
        id: Math.random().toString(36).substring(2, 10),
        points: [{ x, y }],
        color, size, tool,
      };
      room.addStroke(stroke);
      socket.to(roomId).emit("draw_data", { stroke });
    });

    socket.on("draw_move", ({ roomId, playerId, x, y }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room || room.state.drawerId !== playerId) return;

      const strokes = room.strokes;
      const last = strokes[strokes.length - 1];
      if (last) last.points.push({ x, y });

      socket.to(roomId).emit("draw_move", { x, y });
    });

    socket.on("draw_end", ({ roomId, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room || room.state.drawerId !== playerId) return;
      socket.to(roomId).emit("draw_end");
    });

    socket.on("canvas_clear", ({ roomId, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room || room.state.drawerId !== playerId) return;
      room.clearCanvas();
      socket.to(roomId).emit("canvas_clear");
    });

    socket.on("draw_undo", ({ roomId, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room || room.state.drawerId !== playerId) return;
      room.undoLastStroke();
      socket.to(roomId).emit("draw_undo");
    });

    // --- CHAT / GUESSING ---
    socket.on("chat", ({ roomId, playerId, text }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player) return;

      // try as a guess first
      if (room.state.phase === "drawing" && playerId !== room.state.drawerId) {
        const result = room.makeGuess(playerId, text);

        if (result.correct) {
          const guessMsg = room.addCorrectGuessMessage(playerId, player.name, result.points!);
          io?.to(roomId).emit("chat_message", guessMsg);
          io?.to(roomId).emit("guess_result", {
            correct: true,
            playerId,
            playerName: player.name,
            points: result.points,
            players: room.getPlayersData(),
            leaderboard: room.getLeaderboard(),
          });
          return;
        }

        if (result.alreadyGuessed) return; // don't show their message
      }

      // normal chat message
      const msg = room.addChatMessage(playerId, player.name, text);
      io?.to(roomId).emit("chat_message", msg);
    });

    // --- NEXT ROUND ---
    socket.on("next_round", ({ roomId, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player?.isHost) return;

      room.nextRound();

      if (room.state.phase === "game_over") {
        io?.to(roomId).emit("game_over", {
          winner: room.getWinner(),
          leaderboard: room.getLeaderboard(),
          players: room.getPlayersData(),
          state: room.state,
        });
        return;
      }

      // new round
      const words = getRandomWords(room.settings.wordCount);
      room.setWordOptions(words);
      const drawer = room.players.get(room.state.drawerId!);

      room.getConnectedPlayers().forEach((p) => {
        io?.to(p.socketId).emit("round_start", {
          drawerId: room.state.drawerId,
          state: room.getStateForPlayer(p.id),
          players: room.getPlayersData(),
        });
      });

      if (drawer) {
        io?.to(drawer.socketId).emit("round_start", {
          drawerId: room.state.drawerId,
          wordOptions: words,
          drawTime: room.settings.drawTime,
          state: room.getStateForPlayer(drawer.id),
          players: room.getPlayersData(),
        });
      }
    });

    // --- END / PLAY AGAIN ---
    socket.on("end_game", ({ roomId, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player?.isHost) return;

      room.endGame();
      io?.to(roomId).emit("game_over", {
        winner: room.getWinner(),
        leaderboard: room.getLeaderboard(),
        players: room.getPlayersData(),
        state: room.state,
      });
    });

    socket.on("play_again", ({ roomId, playerId }) => {
      const room = gameManager.getRoomById(roomId);
      if (!room) return;
      const player = room.players.get(playerId);
      if (!player?.isHost) return;

      room.players.forEach((p) => p.resetForNewGame());
      room.state.phase = "lobby";
      room.state.round = 0;
      room.messages = [];
      room.strokes = [];

      io?.to(roomId).emit("game_reset", {
        state: room.state,
        players: room.getPlayersData(),
      });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);

      gameManager["rooms"].forEach((room) => {
        const player = room.getPlayerBySocketId(socket.id);
        if (!player) return;

        room.removePlayer(player.id);

        if (room.state.phase === "lobby") {
          io?.to(room.id).emit("player_left", { playerId: player.id, players: room.getPlayersData() });
        } else {
          io?.to(room.id).emit("player_disconnected", {
            playerId: player.id,
            playerName: player.name,
            players: room.getPlayersData(),
          });

          // if the drawer left mid-round, end it
          if (room.state.drawerId === player.id && room.state.phase === "drawing") {
            room.endRound("timeout");
          }
        }
      });
    });
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}
