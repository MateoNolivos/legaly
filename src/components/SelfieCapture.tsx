"use client";

import { useEffect, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/imagen";

// Verificación facial: abre la cámara frontal, guía al usuario para centrar el
// rostro (usa la API FaceDetector del navegador si está disponible) y toma la selfie.
export default function SelfieCapture({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const [preview, setPreview] = useState("");
  const [activa, setActiva] = useState(false);
  const [guia, setGuia] = useState("Coloca tu rostro en el centro del círculo");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);

  async function abrir() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setActiva(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          iniciarDeteccion();
        }
      }, 60);
    } catch {
      setError("No se pudo acceder a la cámara. Revisa los permisos.");
    }
  }

  function iniciarDeteccion() {
    const FD = (window as any).FaceDetector;
    if (!FD) {
      // Sin detección facial: permitimos capturar y guiamos por texto.
      setGuia("Centra tu rostro y toma la foto");
      setOk(true);
      return;
    }
    const detector = new FD({ fastMode: true, maxDetectedFaces: 1 });
    const tick = async () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      try {
        const caras = await detector.detect(v);
        if (!caras.length) {
          setGuia("Coloca tu rostro en el centro"); setOk(false);
        } else {
          const box = caras[0].boundingBox;
          const ratio = box.width / (v.videoWidth || 1);
          if (ratio < 0.25) { setGuia("Acércate un poco"); setOk(false); }
          else if (ratio > 0.6) { setGuia("Aléjate un poco"); setOk(false); }
          else { setGuia("¡Perfecto! Ya puedes tomar la foto"); setOk(true); }
        }
      } catch {
        setGuia("Centra tu rostro y toma la foto"); setOk(true);
      }
    };
    loopRef.current = window.setInterval(tick, 400);
  }

  function cerrar() {
    if (loopRef.current) clearInterval(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActiva(false);
  }

  async function capturar() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 480;
    canvas.height = v.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const data = await comprimirImagen(canvas.toDataURL("image/jpeg", 0.85), 900, 0.8);
    setPreview(data);
    onCapture(data);
    cerrar();
  }

  useEffect(() => () => cerrar(), []);

  if (preview) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Selfie" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500" />
        <div>
          <p className="text-sm text-emerald-600 font-medium">✓ Verificación facial lista</p>
          <button type="button" onClick={() => { setPreview(""); }} className="text-xs text-slate-400 hover:underline">
            Volver a tomar
          </button>
        </div>
      </div>
    );
  }

  if (activa) {
    return (
      <div className="space-y-2">
        <div className="relative w-48 h-48 mx-auto">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="w-48 h-48 rounded-full object-cover bg-black" playsInline muted />
          <div className={`absolute inset-0 rounded-full border-4 ${ok ? "border-emerald-500" : "border-amber-400"}`} />
        </div>
        <p className={`text-center text-sm font-medium ${ok ? "text-emerald-600" : "text-amber-600"}`}>{guia}</p>
        <div className="flex gap-2 justify-center">
          <button type="button" onClick={capturar} disabled={!ok}
            className="bg-brand text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-brand-dark disabled:opacity-50">
            📸 Tomar selfie
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
      <button type="button" onClick={abrir} className="text-sm text-brand font-medium hover:underline">
        🤳 Iniciar verificación facial
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
