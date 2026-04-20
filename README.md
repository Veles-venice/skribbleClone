# 🎨 Skribbl.io Clone – Real-Time Multiplayer Drawing Game

A full-stack real-time multiplayer drawing and guessing game inspired by skribbl.io.  
Built with React, Node.js, and WebSockets (Socket.IO), this project demonstrates real-time communication, game state management, and collaborative interaction.

---

## 🚀 Features

- 🎮 Multiplayer rooms (create & join via room ID)
- ✏️ Real-time drawing synced across all players
- 🔄 Turn-based gameplay (one player draws, others guess)
- 💬 Live chat & guessing system
- 🧠 Word selection system for drawer
- 🏆 Scoring & leaderboard
- ⚡ WebSocket-based real-time updates

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- HTML5 Canvas API

**Backend**
- Node.js
- Express.js
- Socket.IO

---

## ⚙️ How It Works

- Players join a room using a room ID
- The server manages game state using structured classes (Room, Player, GameManager)
- One player is assigned as the drawer each round
- Drawing data (mouse coordinates) is sent via WebSockets and broadcast to all players
- Other players submit guesses in real time
- Correct guesses update scores and advance the game

---

## 📦 Installation & Setup

### 1. Clone the repository
```bash
git clone <https://github.com/Veles-venice/skribbleClone.git>
cd skribbl-clone

- Install dependencies 
npm install
cd client && npm install

- Run the project 
# Run backend
npm start

# Run frontend (in another terminal)
cd client
npm run dev

🌐 Live Demo

👉 [https://skribble-clone-2f0lujkdj-veles-venices-projects.vercel.app/]

📌 Notes
This is an MVP focused on core gameplay and real-time functionality
Game state is managed in-memory (no database used)
Designed to demonstrate WebSocket architecture and interactive systems


🔮 Future Improvements
Persistent database (MongoDB/PostgreSQL)
Hints system & advanced word logic
Better UI/UX and animations
Room settings & player limits
Deployment optimization

👤 Author

Krish Singh
Github : https://github.com/Veles-venice