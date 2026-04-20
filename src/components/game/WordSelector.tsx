import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  wordOptions: string[];
  onChooseWord: (word: string) => Promise<boolean>;
  isOpen: boolean;
}

export default function WordSelector({ wordOptions, onChooseWord, isOpen }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen) { setSelected(null); setChoosing(false); setCountdown(15); return; }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (wordOptions.length > 0 && !selected) handleChoose(wordOptions[0]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, wordOptions, selected]);

  const handleChoose = async (word: string) => {
    if (choosing) return;
    setSelected(word); setChoosing(true);
    await onChooseWord(word);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-sm bg-[#12121A] border border-[#27272A] p-0 shadow-none" showCloseButton={false}>
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-base font-semibold text-white flex justify-between items-center">
              Choose a word
              <span className={`font-mono text-sm ${countdown <= 5 ? "text-[#EF4444]" : "text-[#A1A1AA]"}`}>{countdown}s</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {wordOptions.map((word) => (
              <button key={word} onClick={() => handleChoose(word)} disabled={choosing}
                className={`w-full h-10 px-4 rounded-lg text-sm text-left transition-colors duration-150 ${
                  selected === word
                    ? "bg-[#7C3AED] text-white"
                    : "bg-[#1A1A23] hover:bg-[#242430] text-white border border-[#27272A] hover:border-[#3F3F46]"
                } disabled:opacity-50`}>
                {word}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
