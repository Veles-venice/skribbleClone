import { useRef, useEffect, useCallback, memo } from "react";
import type { Stroke } from "@/types/game";

interface CanvasProps {
  isDrawer: boolean;
  color: string;
  brushSize: number;
  tool: "brush" | "eraser";
  onDrawStart: (x: number, y: number, color: string, size: number, tool: "brush" | "eraser") => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;
  socket: React.MutableRefObject<any>;
  gamePhase: string;
}

function Canvas({
  isDrawer,
  color,
  brushSize,
  tool,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  socket,
  gamePhase,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const prevPhaseRef = useRef(gamePhase);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const allStrokes = [...strokesRef.current];
    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      allStrokes.push(currentStrokeRef.current);
    }

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;

      ctx.strokeStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    });
  }, []);

  useEffect(() => {
    if (gamePhase === "choosing" && prevPhaseRef.current !== "choosing") {
      strokesRef.current = [];
      currentStrokeRef.current = null;
      redrawCanvas();
    }
    prevPhaseRef.current = gamePhase;
  }, [gamePhase, redrawCanvas]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const handleDrawData = ({ stroke }: { stroke: Stroke }) => { strokesRef.current.push(stroke); redrawCanvas(); };
    const handleDrawMove = ({ x, y }: { x: number; y: number }) => {
      const last = strokesRef.current[strokesRef.current.length - 1];
      if (last) { last.points.push({ x, y }); redrawCanvas(); }
    };
    const handleDrawEnd = () => {};
    const handleCanvasClear = () => { strokesRef.current = []; redrawCanvas(); };
    const handleDrawUndo = () => { strokesRef.current.pop(); redrawCanvas(); };

    s.on("draw_data", handleDrawData);
    s.on("draw_move", handleDrawMove);
    s.on("draw_end", handleDrawEnd);
    s.on("canvas_clear", handleCanvasClear);
    s.on("draw_undo", handleDrawUndo);

    return () => {
      s.off("draw_data", handleDrawData);
      s.off("draw_move", handleDrawMove);
      s.off("draw_end", handleDrawEnd);
      s.off("canvas_clear", handleCanvasClear);
      s.off("draw_undo", handleDrawUndo);
    };
  }, [socket, redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      redrawCanvas();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redrawCanvas]);

  const getCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) { clientX = e.touches[0]?.clientX || 0; clientY = e.touches[0]?.clientY || 0; }
    else { clientX = e.clientX; clientY = e.clientY; }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const drawLocalSegment = useCallback((x: number, y: number, isStart: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    ctx.strokeStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isStart) {
      ctx.beginPath();
      ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
      ctx.fill();
    } else {
      const points = stroke.points;
      if (points.length >= 2) {
        const prev = points[points.length - 2];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const { x, y } = getCoordinates(e);
    isDrawing.current = true;
    currentStrokeRef.current = { id: Math.random().toString(36).substring(2, 10), points: [{ x, y }], color, size: brushSize, tool };
    drawLocalSegment(x, y, true);
    onDrawStart(x, y, color, brushSize, tool);
  }, [isDrawer, color, brushSize, tool, onDrawStart, getCoordinates, drawLocalSegment]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing.current) return;
    const { x, y } = getCoordinates(e);
    if (currentStrokeRef.current) currentStrokeRef.current.points.push({ x, y });
    drawLocalSegment(x, y, false);
    onDrawMove(x, y);
  }, [isDrawer, onDrawMove, getCoordinates, drawLocalSegment]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawer) return;
    isDrawing.current = false;
    if (currentStrokeRef.current) { strokesRef.current.push(currentStrokeRef.current); currentStrokeRef.current = null; }
    onDrawEnd();
  }, [isDrawer, onDrawEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    isDrawing.current = true;
    currentStrokeRef.current = { id: Math.random().toString(36).substring(2, 10), points: [{ x, y }], color, size: brushSize, tool };
    drawLocalSegment(x, y, true);
    onDrawStart(x, y, color, brushSize, tool);
  }, [isDrawer, color, brushSize, tool, onDrawStart, getCoordinates, drawLocalSegment]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing.current) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    if (currentStrokeRef.current) currentStrokeRef.current.points.push({ x, y });
    drawLocalSegment(x, y, false);
    onDrawMove(x, y);
  }, [isDrawer, onDrawMove, getCoordinates, drawLocalSegment]);

  return (
    <div ref={containerRef} className="w-full h-full bg-white rounded-xl overflow-hidden border-[2px] border-[#242430] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] cursor-crosshair">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />
    </div>
  );
}

export default memo(Canvas);
