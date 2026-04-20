import { useRef, useEffect, useState } from "react";
import type { ChatMessage } from "@/types/game";

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function Chat({ messages, onSendMessage }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0A0A0F]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col space-y-1">
        {messages.map((msg) => {
          if (msg.type === "system") {
            return <div key={msg.id} className="text-sm italic text-[#71717A] pb-1">{msg.text}</div>;
          }
          if (msg.type === "correct_guess") {
            return <div key={msg.id} className="text-sm text-[#22C55E] pb-1">{msg.playerName}: guessed the word!</div>;
          }
          return (
            <div key={msg.id} className="text-sm flex gap-2 pb-1">
              <span className="font-medium text-[#A1A1AA] shrink-0">{msg.playerName}</span>
              <span className="text-white break-words">{msg.text}</span>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#1A1A23] shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Type your guess..."
          maxLength={100}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="w-full bg-transparent border-b border-[#3F3F46] focus:border-[#7C3AED] text-sm text-white placeholder:text-[#52525B] outline-none transition-colors duration-150 pb-1" />
      </div>
    </div>
  );
}
