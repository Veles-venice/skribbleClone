import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import Landing from "./pages/Landing";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e1b4b",
            color: "#fff",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          },
        }}
      />
    </>
  );
}
