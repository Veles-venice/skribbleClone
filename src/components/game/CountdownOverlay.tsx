import { useEffect, useState, useCallback } from "react";

interface Props {
  isActive: boolean;
  onComplete: () => void;
}

const STEPS = ["3", "2", "1"];

export default function CountdownOverlay({ isActive, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  const reset = useCallback(() => { setStep(0); setVisible(false); }, []);

  useEffect(() => {
    if (!isActive) { reset(); return; }
    setVisible(true); setStep(0);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= STEPS.length) {
        clearInterval(interval);
        setTimeout(() => { setVisible(false); onComplete(); }, 400); // Shorter tail end
        return;
      }
      setStep(current);
    }, 700);

    return () => clearInterval(interval);
  }, [isActive, onComplete, reset]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,15,0.8)] backdrop-blur-[12px]">
      <div key={step} className="animate-fade-in text-6xl font-medium tracking-tight text-white select-none">
        {STEPS[step]}
      </div>
    </div>
  );
}
