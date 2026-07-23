"use client";

import { useEffect, useRef, useState } from "react";

// Pad de firma táctil (tableta/iPad/ratón). Exporta PNG (data-URL) en un input oculto
// para que las Server Actions lo incrusten en el PDF generado.
export function SignaturePad({ name, label, requerida = false }: { name: string; label: string; requerida?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firmado, setFirmado] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const dibujando = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1a2333";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dibujando.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onUp = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    setFirmado(true);
    if (hiddenRef.current) hiddenRef.current.value = canvasRef.current!.toDataURL("image/png");
  };

  const limpiar = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmado(false);
    if (hiddenRef.current) hiddenRef.current.value = "";
  };

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          {label} {requerida && <span className="text-red-600">*</span>}
        </p>
        <button type="button" onClick={limpiar} className="text-xs text-blue-700 underline">
          Limpiar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="h-28 w-full cursor-crosshair rounded border border-dashed border-slate-300 bg-slate-50"
        style={{ touchAction: "none" }}
      />
      <input type="hidden" name={name} ref={hiddenRef} />
      <p className="mt-1 text-xs text-slate-400">
        {firmado ? "Firma capturada ✓" : "Firme aquí con el dedo o stylus (tableta) o con el ratón."}
      </p>
    </div>
  );
}
