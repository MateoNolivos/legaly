"use client";

import { useState } from "react";
import PhotoCapture from "./PhotoCapture";

// Carga tesseract.js desde un CDN (una sola vez) para hacer OCR en el navegador.
function cargarTesseract(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.Tesseract) return resolve(w.Tesseract);
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    s.onload = () => resolve((window as any).Tesseract);
    s.onerror = () => reject(new Error("No se pudo cargar el OCR"));
    document.body.appendChild(s);
  });
}

// Captura la foto de la cédula e intenta leer el número automáticamente (OCR).
export default function CedulaCapture({
  onFoto,
  onNumero,
}: {
  onFoto: (dataUrl: string) => void;
  onNumero: (numero: string) => void;
}) {
  const [estado, setEstado] = useState("");

  async function procesar(dataUrl: string) {
    onFoto(dataUrl);
    setEstado("Leyendo la cédula… (puede tardar unos segundos)");
    try {
      const Tesseract = await cargarTesseract();
      const { data } = await Tesseract.recognize(dataUrl, "spa");
      const texto: string = data?.text || "";
      // Busca un número de 10 dígitos (cédula ecuatoriana).
      const match = texto.replace(/[^0-9\s]/g, " ").match(/\b\d{10}\b/);
      if (match) {
        onNumero(match[0]);
        setEstado(`✓ Cédula detectada: ${match[0]} (verifícala)`);
      } else {
        setEstado("No se detectó el número automáticamente. Escríbelo manualmente.");
      }
    } catch {
      setEstado("No se pudo procesar el OCR. Escribe el número manualmente.");
    }
  }

  return (
    <div className="space-y-2">
      <PhotoCapture onCapture={procesar} shape="rect" alto={120} />
      {estado && <p className="text-xs text-slate-500">{estado}</p>}
    </div>
  );
}
