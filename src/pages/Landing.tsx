import { useState } from "react";
import { useNavigate } from "react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Plus, ArrowRight } from "lucide-react";
import { useSocket } from "@/providers/socket";
import type { RoomSettings } from "@/types/game";

export default function Landing() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, isConnected, error } = useSocket();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [settings, setSettings] = useState<RoomSettings>({
    maxPlayers: 8, rounds: 3, drawTime: 80, wordCount: 3, hints: 2, isPrivate: false,
  });

  const handleCreate = async () => {
    if (!name.trim()) return setErr("Enter your name");
    setErr(""); setLoading(true);
    const ok = await createRoom(name.trim(), settings);
    setLoading(false);
    if (ok) { setShowCreate(false); navigate("/lobby"); }
  };

  const handleJoin = async () => {
    if (!name.trim()) return setErr("Enter your name");
    if (!code.trim()) return setErr("Enter a room code");
    setErr(""); setLoading(true);
    const ok = await joinRoom(code.trim().toUpperCase(), name.trim());
    setLoading(false);
    if (ok) { setShowJoin(false); navigate("/lobby"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="mb-16">
          <h1 className="text-[32px] font-bold tracking-[-0.02em] text-white">SketchGuess</h1>
          <p className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">
            Real-time multiplayer drawing and guessing game.
          </p>
          {!isConnected && <p className="text-xs text-[#52525B] mt-4">Connecting to server...</p>}
        </div>

        <div className="space-y-3">
          {/* Create Room */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <button className="w-full h-10 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-150">
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                Create Room
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-[#12121A] border-[#27272A] text-white p-0">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-[18px] font-semibold text-white">Create Room</DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-xs text-[#A1A1AA] block mb-2">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      placeholder="Your display name"
                      className="w-full h-10 bg-transparent border-b border-[#3F3F46] focus:border-[#7C3AED] text-sm text-white placeholder:text-[#52525B] outline-none transition-colors duration-150 px-0" />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] mb-2 flex justify-between"><span>Players</span><span className="text-white">{settings.maxPlayers}</span></label>
                    <Slider value={[settings.maxPlayers]} onValueChange={([v]) => setSettings({ ...settings, maxPlayers: v })} min={2} max={12} />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] mb-2 flex justify-between"><span>Rounds</span><span className="text-white">{settings.rounds}</span></label>
                    <Slider value={[settings.rounds]} onValueChange={([v]) => setSettings({ ...settings, rounds: v })} min={1} max={10} />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] mb-2 flex justify-between"><span>Draw Time</span><span className="text-white">{settings.drawTime}s</span></label>
                    <Slider value={[settings.drawTime]} onValueChange={([v]) => setSettings({ ...settings, drawTime: v })} min={15} max={180} step={5} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#A1A1AA]">Private</label>
                    <Switch checked={settings.isPrivate} onCheckedChange={(v) => setSettings({ ...settings, isPrivate: v })} />
                  </div>
                  {(err || error) && <p className="text-xs text-[#EF4444]">{err || error}</p>}
                </div>
              </div>
              <div className="p-4 border-t border-[#27272A]">
                <button onClick={handleCreate} disabled={loading || !isConnected}
                  className="w-full h-10 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-30 text-sm font-medium text-white transition-colors duration-150">
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Join Room */}
          <Dialog open={showJoin} onOpenChange={setShowJoin}>
            <DialogTrigger asChild>
              <button className="w-full h-10 rounded-lg border border-[#3F3F46] text-[#A1A1AA] hover:text-white hover:border-[#52525B] text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-150">
                <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                Join Room
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-[#12121A] border-[#27272A] text-white p-0">
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-[18px] font-semibold text-white">Join Room</DialogTitle>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-xs text-[#A1A1AA] block mb-2">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20}
                      placeholder="Your display name"
                      className="w-full h-10 bg-transparent border-b border-[#3F3F46] focus:border-[#7C3AED] text-sm text-white placeholder:text-[#52525B] outline-none transition-colors duration-150 px-0" />
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] block mb-2">Room Code</label>
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      placeholder="ABC123"
                      className="w-full h-10 bg-transparent border-b border-[#3F3F46] focus:border-[#7C3AED] text-base text-white font-mono tracking-[0.2em] placeholder:text-[#52525B] placeholder:tracking-[0.2em] outline-none transition-colors duration-150 px-0" />
                  </div>
                  {(err || error) && <p className="text-xs text-[#EF4444]">{err || error}</p>}
                </div>
              </div>
              <div className="p-4 border-t border-[#27272A]">
                <button onClick={handleJoin} disabled={loading || !isConnected}
                  className="w-full h-10 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-30 text-sm font-medium text-white transition-colors duration-150">
                  {loading ? "Joining..." : "Join"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
