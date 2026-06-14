"use client";

import { useEffect, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagen";

// Captura de documento con MARCO GUÍA (forma de cédula) y CAPTURA AUTOMÁTICA:
// cuando el documento está bien encuadrado y enfocado, la toma sola.
// También permite subir archivo (imagen o PDF) o capturar manualmente.
export default function DocumentCapture({
  instruccion,
  onCapture,
}: {
  instruccion: string;
  onCapture: (dataUrl: string, esPdf: boolean) => void;
}) {
  const [preview, setPreview] = useState("");
  const [activa, setActiva] = useState(false);
  const [error, setError] = useState("");
  const [guia, setGuia] = useState("");
  const [ok, setOk] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const capturandoRef = useRef(false);
  const estableRef = useRef(0);
  const prevRef = useRef(0);
  const inicioRef = useRef(0);

  async function usar(dataUrl: string, esPdf: boolean) {
    const final = esPdf ? dataUrl : await comprimirImagen(dataUrl, 1600, 0.8);
    setPreview(esPdf ? "" : final);
    onCapture(final, esPdf);
  }

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15_000_000) { setError("El archivo es demasiado grande."); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = () => usar(String(reader.result), file.type === "application/pdf");
    reader.readAsDataURL(file);
  }

  // Recorte centrado con proporción de cédula.
  function recorte(v: HTMLVideoElement) {
    const vw = v.videoWidth || 1280, vh = v.videoHeight || 720;
    let cw = vw * 0.9, ch = cw / 1.586;
    if (ch > vh * 0.95) { ch = vh * 0.9; cw = ch * 1.586; }
    return { sx: (vw - cw) / 2, sy: (vh - ch) / 2, cw, ch };
  }

  async function abrir() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setActiva(true);
      estableRef.current = 0;
      capturandoRef.current = false;
      inicioRef.current = Date.now();
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          loopRef.current = window.setInterval(analizar, 300);
        }
      }, 60);
    } catch {
      setError("No se pudo acceder a la cámara. Usa 'Subir archivo'.");
    }
  }

  // Mide nitidez/contenido del recuadro para decidir la captura automática.
  function analizar() {
    const v = videoRef.current;
    if (!v || v.readyState < 2 || capturandoRef.current) return;
    const { sx, sy, cw, ch } = recorte(v);
    const tw = 160, th = Math.round(tw / 1.586);
    const c = document.createElement("canvas");
    c.width = tw; c.height = th;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, sx, sy, cw, ch, 0, 0, tw, th);
    const d = ctx.getImageData(0, 0, tw, th).data;
    let edges = 0, ne = 0, bright = 0;
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const i = (y * tw + x) * 4;
        const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        bright += g;
        if (x > 0) {
          const j = (y * tw + x - 1) * 4;
          const gp = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
          edges += Math.abs(g - gp); ne++;
        }
      }
    }
    const m = edges / ne;        // nitidez / contenido
    const avg = bright / (tw * th); // brillo (la cédula es clara y llena el recuadro)
    const estable = prevRef.current > 0 && Math.abs(m - prevRef.current) / m < 0.2;
    prevRef.current = m;

    // Margen inicial para colocar la cédula y que la cámara enfoque.
    if (Date.now() - inicioRef.current < 1200) {
      setOk(false); setGuia("Coloca la cédula dentro del recuadro…");
      return;
    }

    // "Bueno" = la cédula llena el recuadro (brillo), está nítida y quieta.
    const NECESARIO = 5; // ~1.5 s sostenido (intervalo 300 ms)
    const bueno = avg > 115 && m > 9 && estable;

    if (!bueno) {
      estableRef.current = 0;
      setOk(false);
      if (avg <= 115) setGuia("Acerca la cédula hasta llenar el recuadro");
      else if (m <= 9) setGuia("Enfoca bien la cédula");
      else setGuia("Mantén firme, no muevas…");
      return;
    }

    estableRef.current += 1;
    setOk(true);
    const restante = NECESARIO - estableRef.current;
    if (restante > 0) {
      setGuia(`Perfecto, no muevas… capturando en ${Math.ceil(restante * 0.3)} s`);
    } else {
      setGuia("¡Capturando!");
      capturar();
    }
  }

  function capturar() {
    const v = videoRef.current;
    if (!v || capturandoRef.current) return;
    capturandoRef.current = true;
    const { sx, sy, cw, ch } = recorte(v);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cw); canvas.height = Math.round(ch);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(v, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
    usar(canvas.toDataURL("image/jpeg", 0.9), false);
    cerrar();
  }

  function cerrar() {
    if (loopRef.current) clearInterval(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActiva(false);
    setGuia("");
  }

  useEffect(() => () => cerrar(), []);

  if (activa) {
    return (
      <div className="space-y-2">
        <div className="relative mx-auto" style={{ maxWidth: 360 }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`rounded-xl shadow-[0_0_0_2000px_rgba(0,0,0,0.45)] border-2 ${ok ? "border-emerald-400" : "border-white/90"}`}
                 style={{ width: "86%", aspectRatio: "1.586 / 1" }} />
          </div>
          <p className="absolute top-2 left-0 right-0 text-center text-xs text-white font-medium drop-shadow px-2">
            {guia || instruccion}
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <button type="button" onClick={capturar} className="bg-brand text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-brand-dark">
            📸 Capturar ahora
          </button>
          <button type="button" onClick={cerrar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {preview ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Documento" className="h-20 rounded-lg border border-slate-200 object-cover" />
          <button type="button" onClick={() => setPreview("")} className="text-xs text-brand hover:underline">Volver a capturar / cambiar</button>
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          <button type="button" onClick={abrir} className="text-sm text-brand font-medium hover:underline">
            📷 Usar cámara
          </button>
          <label className="text-sm text-brand font-medium cursor-pointer hover:underline">
            📁 Subir archivo
            <input type="file" accept="application/pdf,image/*" onChange={onArchivo} className="hidden" />
          </label>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
