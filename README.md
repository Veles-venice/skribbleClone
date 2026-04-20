# SketchGuess

A real-time multiplayer drawing and guessing game built with React, Socket.IO, and Hono.

## How to Run

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## How to Play

1. Create a room or join one with a room code
2. The host starts the game when everyone is ready
3. The drawer picks a word and draws it on the canvas
4. Other players guess the word in the chat
5. Points are awarded for fast correct guesses
6. The player with the most points at the end wins

## Tech Stack

- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: Hono (Node.js), Socket.IO
- **Build**: Vite
- **State**: In-memory (no database needed)

## Project Structure

```
app/
├── api/                    # backend
│   ├── boot.ts             # server entry point
│   ├── socket.ts           # socket.io event handlers
│   └── game-engine/        # game logic
│       ├── GameManager.ts   # room management
│       ├── Room.ts          # game state, timer, scoring
│       ├── Player.ts        # player data
│       └── wordBank.ts      # word list
├── src/                    # frontend
│   ├── main.tsx            # entry point
│   ├── App.tsx             # routes
│   ├── index.css           # design system
│   ├── providers/
│   │   └── socket.tsx      # socket context
│   ├── pages/
│   │   ├── Landing.tsx     # home page
│   │   ├── Lobby.tsx       # waiting room
│   │   └── Game.tsx        # game screen
│   ├── components/game/
│   │   ├── Canvas.tsx      # drawing canvas
│   │   ├── Toolbar.tsx     # drawing tools
│   │   ├── Chat.tsx        # chat & guessing
│   │   ├── GameInfo.tsx    # timer, word display
│   │   ├── PlayerList.tsx  # scoreboard
│   │   ├── WordSelector.tsx
│   │   ├── CountdownOverlay.tsx
│   │   └── GameOver.tsx
│   └── types/
│       └── game.ts         # shared types
└── package.json
```
