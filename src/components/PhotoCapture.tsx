"use client";

import { useRef, useState } from "react";

// Permite subir una imagen desde el dispositivo O tomarla con la cámara en el momento.
// Devuelve la imagen como data URL a través de onCapture.
export default function PhotoCapture({
  onCapture,
  shape = "rect",
  alto = 160,
}: {
  onCapture: (dataUrl: string) => void;
  shape?: "rect" | "circle";
  alto?: number;
}) {
  const [preview, setPreview] = useState("");
  const [camActiva, setCamActiva] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function usarImagen(dataUrl: string) {
    setPreview(dataUrl);
    onCapture(dataUrl);
  }

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3_000_000) {
      setError("La imagen debe pesar menos de 3 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => usarImagen(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function abrirCamara() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCamActiva(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setError("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
    }
  }

  function cerrarCamara() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamActiva(false);
  }

  function capturar() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    usarImagen(canvas.toDataURL("image/jpeg", 0.85));
    cerrarCamara();
  }

  const radius = shape === "circle" ? "rounded-full" : "rounded-lg";

  return (
    <div>
      {camActiva ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className={`w-full ${radius} bg-black`} style={{ maxHeight: 280 }} playsInline muted />
          <div className="flex gap-2">
            <button type="button" onClick={capturar} className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-dark">
              📸 Capturar
            </button>
            <button type="button" onClick={cerrarCamara} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-slate-400">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className={`bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 ${radius}`}
            style={{ width: shape === "circle" ? alto : alto * 1.4, height: alto }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-300 text-xs">Sin imagen</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-brand font-medium cursor-pointer hover:underline">
              📁 Subir archivo
              <input type="file" accept="image/*" onChange={onArchivo} className="hidden" />
            </label>
            <button type="button" onClick={abrirCamara} className="text-sm text-brand font-medium text-left hover:underline">
              📷 Tomar foto ahora
            </button>
            <label className="text-sm text-slate-500 cursor-pointer hover:underline sm:hidden">
              📱 Usar cámara del móvil
              <input type="file" accept="image/*" capture="user" onChange={onArchivo} className="hidden" />
            </label>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
