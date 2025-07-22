import React, { useEffect, useRef, useState } from "react";
// Dynamic import for fabric.js to support ESM/CJS and Next.js SSR

// Add toolbar CSS (can be moved to a CSS file if desired)
const toolbarStyles = `
.canvas-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 0.5em;
  justify-content: center;
  padding: 0.5em;
}
.canvas-toolbar-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #222;
  border-radius: 6px;
  padding: 0.3em 0.8em;
  font-weight: 500;
  margin: 0;
  transition: background 0.2s, color 0.2s, border 0.2s;
  cursor: pointer;
  outline: none;
  font-size: 0.9em;
}
.canvas-toolbar-btn.active,
.canvas-toolbar-btn:focus {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}
.canvas-toolbar-btn.eraser {
  background: #fff7ed;
  color: #d97706;
  border-color: #fbbf24;
}
.canvas-toolbar-btn.pen {
  background: #e0f2fe;
  color: #2563eb;
  border-color: #38bdf8;
}
`;

interface CanvasPaintProps {
  onSave: (data: { image: string; json: string }) => void;
  initialData?: string;
}

const MAX_CANVAS_WIDTH = 600;
const MIN_CANVAS_HEIGHT = 400;
const MAX_CANVAS_HEIGHT = 600;

export const CanvasPaint: React.FC<CanvasPaintProps> = ({
  onSave,
  initialData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricRef = useRef<any>(null);
  const [brushColor, setBrushColor] = useState("#222");
  const [brushSize, setBrushSize] = useState(3);
  const [canvasWidth, setCanvasWidth] = useState(MAX_CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);
  // Track tool: 'pen', 'eraser', 'draw', 'select'
  const [activeTool, setActiveTool] = useState<
    "pen" | "eraser" | "draw" | "select"
  >("pen");

  // Responsive: set canvas width and height to container width (max 600px)
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, MAX_CANVAS_WIDTH);
        setCanvasWidth(width);
        // For mobile, make height equal to width for a square canvas
        if (window.innerWidth < 768) {
          setCanvasHeight(width);
        } else {
          setCanvasHeight(MIN_CANVAS_HEIGHT);
        }
      }
    }
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let fabricCanvas: any = null;

    async function loadFabric() {
      const mod = await import("fabric");
      const fabricNS = mod;
      if (!canvasRef.current || !isMounted) return;
      fabricCanvas = new fabricNS.Canvas(canvasRef.current, {
        isDrawingMode:
          activeTool === "draw" ||
          activeTool === "pen" ||
          activeTool === "eraser",
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#fff",
      });
      fabricRef.current = fabricCanvas;
      // Set initial brush settings
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = brushColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
      } else if (fabricNS.PencilBrush) {
        fabricCanvas.freeDrawingBrush = new fabricNS.PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = brushColor;
        fabricCanvas.freeDrawingBrush.width = brushSize;
      }
      if (initialData) {
        fabricCanvas.loadFromJSON(
          initialData,
          fabricCanvas.renderAll.bind(fabricCanvas)
        );
      }
    }

    loadFabric();

    return () => {
      isMounted = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [initialData, canvasWidth, canvasHeight]);

  // Update brush when color, size, or tool changes
  useEffect(() => {
    if (fabricRef.current) {
      if (fabricRef.current.freeDrawingBrush) {
        fabricRef.current.freeDrawingBrush.color = brushColor;
        fabricRef.current.freeDrawingBrush.width = brushSize;
      } else if (fabricRef.current.PencilBrush) {
        fabricRef.current.freeDrawingBrush = new fabricRef.current.PencilBrush(
          fabricRef.current
        );
        fabricRef.current.freeDrawingBrush.color = brushColor;
        fabricRef.current.freeDrawingBrush.width = brushSize;
      }
      // Set drawing/select mode
      fabricRef.current.isDrawingMode =
        activeTool === "draw" ||
        activeTool === "pen" ||
        activeTool === "eraser";
    }
  }, [brushColor, brushSize, activeTool]);

  const handleSave = () => {
    if (!fabricRef.current) return;
    const image = fabricRef.current.toDataURL({ format: "png" });
    const json = JSON.stringify(fabricRef.current.toJSON());
    onSave({ image, json });
  };

  const setDrawingMode = (mode: boolean) => {
    if (fabricRef.current) {
      fabricRef.current.isDrawingMode = mode;
    }
  };

  const clearCanvas = () => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = "#fff";
      fabricRef.current.renderAll();
    }
  };

  // Toolbar UI
  return (
    <div className="w-full flex flex-col items-stretch">
      <style>{toolbarStyles}</style>
      <div className="canvas-toolbar bg-gray-50 border-b">
        <label className="flex items-center gap-1 text-sm">
          Color:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-8 h-8 p-0 border rounded"
          />
        </label>
        <label className="flex items-center gap-1 text-sm">
          Size:
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20"
          />
          <span className="w-6 text-xs">{brushSize}</span>
        </label>
        <button
          type="button"
          className={`canvas-toolbar-btn eraser${
            activeTool === "eraser" ? " active" : ""
          }`}
          onClick={() => {
            setActiveTool("eraser");
            setBrushColor("#fff");
          }}
        >
          Eraser
        </button>
        <button
          type="button"
          className={`canvas-toolbar-btn pen${
            activeTool === "pen" ? " active" : ""
          }`}
          onClick={() => {
            setActiveTool("pen");
            setBrushColor("#222");
          }}
        >
          Pen
        </button>
        <button
          type="button"
          className={`canvas-toolbar-btn${
            activeTool === "draw" ? " active" : ""
          }`}
          onClick={() => setActiveTool("draw")}
        >
          Draw
        </button>
        <button
          type="button"
          className={`canvas-toolbar-btn${
            activeTool === "select" ? " active" : ""
          }`}
          onClick={() => setActiveTool("select")}
        >
          Select
        </button>
        <button
          type="button"
          className="canvas-toolbar-btn"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="canvas-toolbar-btn"
          onClick={clearCanvas}
        >
          Clear
        </button>
      </div>
      <div
        ref={containerRef}
        className="w-full bg-white"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ 
            width: "100%", 
            height: "auto", 
            display: "block", 
            touchAction: "none",
            maxHeight: "70vh" 
          }}
        />
      </div>
    </div>
  );
};

export default CanvasPaint;
