import { Pen, Eraser, Undo2, Trash2 } from "lucide-react";

interface Props {
  color: string;
  brushSize: number;
  tool: "brush" | "eraser";
  onColorChange: (c: string) => void;
  onBrushSizeChange: (s: number) => void;
  onToolChange: (t: "brush" | "eraser") => void;
  onUndo: () => void;
  onClear: () => void;
  isDrawer: boolean;
}

const COLORS = ["#FFFFFF","#A1A1AA","#52525B","#0A0A0F","#EF4444","#F97316","#EAB308","#22C55E","#3B82F6","#7C3AED","#EC4899"];
const SIZES = [2, 4, 8, 14, 22];

export default function Toolbar({ color, brushSize, tool, onColorChange, onBrushSizeChange, onToolChange, onUndo, onClear, isDrawer }: Props) {
  if (!isDrawer) return null;

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 h-12 px-2 bg-[#12121A] border border-[#27272A] rounded-full flex items-center gap-2 shadow-lg animate-slide-up">
      {/* colors */}
      <div className="flex gap-1 pr-4 border-r border-[#27272A] pl-2">
        {COLORS.map((c) => (
          <button key={c} onClick={() => { onColorChange(c); onToolChange("brush"); }}
            className={`w-6 h-6 rounded-full transition-transform ${
              color === c && tool === "brush" ? "scale-110 ring-2 ring-[#7C3AED] ring-offset-2 ring-offset-[#12121A]" : ""
            }`}
            style={{ backgroundColor: c, border: c === "#0A0A0F" ? "1px solid #3F3F46" : "none" }} />
        ))}
      </div>

      {/* sizes */}
      <div className="flex items-center gap-1 pr-4 border-r border-[#27272A]">
        {SIZES.map((s) => (
          <button key={s} onClick={() => onBrushSizeChange(s)}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
              brushSize === s ? "bg-[#242430]" : "hover:bg-[#1A1A23]"
            }`}>
            <div className="rounded-full bg-white" style={{ width: Math.min(s, 16), height: Math.min(s, 16) }} />
          </button>
        ))}
      </div>

      {/* actions */}
      <div className="flex items-center gap-1 pr-2">
        <button onClick={() => onToolChange("brush")}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${tool === "brush" ? "bg-[#242430] text-white" : "text-[#A1A1AA] hover:text-white"}`}>
          <Pen className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button onClick={() => onToolChange("eraser")}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${tool === "eraser" ? "bg-[#242430] text-white" : "text-[#A1A1AA] hover:text-white"}`}>
          <Eraser className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <div className="w-px h-4 bg-[#27272A] mx-1" />
        <button onClick={onUndo} className="w-8 h-8 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#1A1A23] transition-colors">
          <Undo2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button onClick={onClear} className="w-8 h-8 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
