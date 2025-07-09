import React, { useEffect, useRef, useState } from 'react';
// Dynamic import for fabric.js to support ESM/CJS and Next.js SSR

interface CanvasPaintProps {
  onSave: (data: { image: string; json: string }) => void;
  initialData?: string;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export const CanvasPaint: React.FC<CanvasPaintProps> = ({ onSave, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<any>(null);
  const [brushColor, setBrushColor] = useState("#222");
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    let isMounted = true;
    let fabricCanvas: any = null;

    async function loadFabric() {
      const mod = await import('fabric');
      const fabricNS = mod;
      if (!canvasRef.current || !isMounted) return;
      fabricCanvas = new fabricNS.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#fff',
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
        fabricCanvas.loadFromJSON(initialData, fabricCanvas.renderAll.bind(fabricCanvas));
      }
    }

    loadFabric();

    return () => {
      isMounted = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [initialData]);

  // Update brush when color or size changes
  useEffect(() => {
    if (fabricRef.current) {
      if (fabricRef.current.freeDrawingBrush) {
        fabricRef.current.freeDrawingBrush.color = brushColor;
        fabricRef.current.freeDrawingBrush.width = brushSize;
      } else if (fabricRef.current.PencilBrush) {
        fabricRef.current.freeDrawingBrush = new fabricRef.current.PencilBrush(fabricRef.current);
        fabricRef.current.freeDrawingBrush.color = brushColor;
        fabricRef.current.freeDrawingBrush.width = brushSize;
      }
    }
  }, [brushColor, brushSize]);

  const handleSave = () => {
    if (!fabricRef.current) return;
    const image = fabricRef.current.toDataURL({ format: 'png' });
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
      fabricRef.current.backgroundColor = '#fff';
      fabricRef.current.renderAll();
    }
  };

  // Toolbar UI
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex gap-2 mb-2 items-center">
        <label className="flex items-center gap-1">
          Color:
          <input
            type="color"
            value={brushColor}
            onChange={e => setBrushColor(e.target.value)}
            className="ml-1 border rounded"
          />
        </label>
        <label className="flex items-center gap-1">
          Size:
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="ml-1"
          />
          <span className="w-6 text-xs">{brushSize}</span>
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setDrawingMode(true);
            setBrushColor("#fff"); // Eraser (white)
          }}
        >
          Eraser
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setDrawingMode(true);
            setBrushColor("#222"); // Default pen color
          }}
        >
          Pen
        </button>
      </div>
      <div className="border rounded shadow-lg overflow-auto" style={{ width: CANVAS_WIDTH, maxWidth: '100%' }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" className="btn" onClick={handleSave}>Save</button>
        <button type="button" className="btn" onClick={clearCanvas}>Clear</button>
        <button type="button" className="btn" onClick={() => setDrawingMode(true)}>Draw</button>
        <button type="button" className="btn" onClick={() => setDrawingMode(false)}>Select</button>
      </div>
    </div>
  );
};

export default CanvasPaint; 