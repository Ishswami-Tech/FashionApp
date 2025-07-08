import React, { useEffect, useRef } from 'react';
import fabric from 'fabric';

interface CanvasPaintProps {
  onSave: (data: { image: string; json: string }) => void;
  initialData?: string;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export const CanvasPaint: React.FC<CanvasPaintProps> = ({ onSave, initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#fff',
    });
    fabricRef.current = fabricCanvas;

    // Load initial data if provided
    if (initialData) {
      fabricCanvas.loadFromJSON(initialData, fabricCanvas.renderAll.bind(fabricCanvas));
    }

    return () => {
      fabricCanvas.dispose();
    };
  }, [initialData]);

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

  // TODO: Add brush size, color, eraser, undo/redo, shape tools, responsive scaling, etc.

  return (
    <div className="w-full flex flex-col items-center">
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