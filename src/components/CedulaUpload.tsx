"use client";

import { useState } from "react";

export type DatosCedula = {
  nombre: string;
  cedula: string;
  fechaNacimiento: string; // yyyy-mm-dd
  genero: string;
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar " + src));
    document.body.appendChild(s);
  });
}

function cargarImagen(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Rota la imagen, la escala a mejor resolución y la pasa a escala de grises.
function preparar(img: HTMLImageElement, deg: number, anchoObjetivo = 1100): string {
  const swap = deg === 90 || deg === 270;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const cw = swap ? h : w;
  const ch = swap ? w : h;
  const escala = Math.max(1, anchoObjetivo / cw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw * escala);
  canvas.height = Math.round(ch * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.scale(escala, escala);
  ctx.drawImage(img, -w / 2, -h / 2);
  // Escala de grises + leve aumento de contraste.
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    g = (g - 128) * 1.25 + 128; // contraste
    g = Math.max(0, Math.min(255, g));
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(id, 0, 0);
  return canvas.toDataURL("image/png");
}

async function pdfADataUrl(dataUrl: string): Promise<string> {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  const pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const bytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return canvas.toDataURL("image/png");
}

const MESES: Record<string, string> = {
  ENE: "01", FEB: "02", MAR: "03", ABR: "04", MAY: "05", JUN: "06",
  JUL: "07", AGO: "08", SEP: "09", SET: "09", OCT: "10", NOV: "11", DIC: "12",
};

// Valida una cédula ecuatoriana (provincia + tercer dígito + dígito verificador).
export function validarCedula(c: string): boolean {
  if (!/^\d{10}$/.test(c)) return false;
  const prov = parseInt(c.slice(0, 2), 10);
  if (prov < 1 || (prov > 24 && prov !== 30)) return false;
  if (parseInt(c[2], 10) >= 6) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(c[i], 10) * coef[i];
    if (v >= 10) v -= 9;
    suma += v;
  }
  const dv = (10 - (suma % 10)) % 10;
  return dv === parseInt(c[9], 10);
}

function parseCedula(texto: string): DatosCedula {
  const t = texto.toUpperCase();
  // Puede haber varios números de 10 dígitos (ej. "No. DOCUMENTO" y el NUI).
  // Elegimos el que pase la validación de cédula; si ninguno, el primero.
  const candidatos = (t.replace(/[^0-9\s]/g, " ").match(/\b\d{10}\b/g) || []);
  const cedula = candidatos.find(validarCedula) || candidatos[0] || "";

  let genero = "";
  if (/\bMUJER\b|FEMENINO/.test(t)) genero = "Femenino";
  else if (/\bHOMBRE\b|MASCULINO/.test(t)) genero = "Masculino";

  let fechaNacimiento = "";
  const cerca = t.match(/NACIMIENTO[\s\S]{0,25}?(\d{1,2})\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|SET|OCT|NOV|DIC)[A-Z]*\s*(\d{4})/);
  const suelta = t.match(/\b(\d{1,2})\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|SET|OCT|NOV|DIC)[A-Z]*\s*(\d{4})\b/);
  const f = cerca || suelta;
  if (f) fechaNacimiento = `${f[3]}-${MESES[f[2]]}-${f[1].padStart(2, "0")}`;
  else {
    const num = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/);
    if (num) fechaNacimiento = `${num[3]}-${num[2].padStart(2, "0")}-${num[1].padStart(2, "0")}`;
  }

  let nombre = "";
  const ap = t.match(/APELLIDOS?\s+([A-ZÑÁÉÍÓÚ ]{3,40}?)\s+(NOMBRES?|CONDICION)/);
  const no = t.match(/NOMBRES?\s+([A-ZÑÁÉÍÓÚ ]{3,40}?)\s+(NACIONALIDAD|FECHA|LUGAR|SEXO|CONDICION|CIUDADANIA)/);
  const apellidos = ap ? ap[1].trim() : "";
  const nombres = no ? no[1].trim() : "";
  if (nombres || apellidos) nombre = `${nombres} ${apellidos}`.replace(/\s+/g, " ").trim();

  return { nombre, cedula, fechaNacimiento, genero };
}

// Puntúa qué tan buena fue una lectura para elegir la mejor orientación.
function puntuar(texto: string, d: DatosCedula): number {
  let p = 0;
  if (d.cedula) p += 3;
  if (d.fechaNacimiento) p += 2;
  if (d.genero) p += 1;
  if (d.nombre) p += 2;
  const t = texto.toUpperCase();
  if (/ECUADOR|CEDULA|IDENTIDAD|NACIONALIDAD/.test(t)) p += 1;
  return p;
}

function cargarTesseract(): Promise<any> {
  return loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js").then(
    () => (window as any).Tesseract
  );
}

export default function CedulaUpload({
  onArchivo,
  onDatos,
}: {
  onArchivo: (dataUrl: string) => void;
  onDatos: (datos: DatosCedula) => void;
}) {
  const [estado, setEstado] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6_000_000) {
      setEstado("El archivo debe pesar menos de 6 MB.");
      return;
    }
    setNombreArchivo(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      onArchivo(dataUrl);
      setEstado("Analizando la cédula (probando orientación)…");
      try {
        const baseUrl = file.type === "application/pdf" ? await pdfADataUrl(dataUrl) : dataUrl;
        const img = await cargarImagen(baseUrl);
        const Tesseract = await cargarTesseract();

        let mejor: DatosCedula = { nombre: "", cedula: "", fechaNacimiento: "", genero: "" };
        let mejorPuntaje = -1;

        // Prueba 4 orientaciones (las fotos suelen venir giradas de lado).
        for (const deg of [0, 90, 270, 180]) {
          const procesada = preparar(img, deg);
          const { data } = await Tesseract.recognize(procesada, "spa");
          const datos = parseCedula(data?.text || "");
          const p = puntuar(data?.text || "", datos);
          if (p > mejorPuntaje) {
            mejorPuntaje = p;
            mejor = datos;
          }
          // Si ya leyó la cédula y algún otro dato, no hace falta seguir.
          if (datos.cedula && (datos.fechaNacimiento || datos.genero || datos.nombre)) break;
        }

        onDatos(mejor);
        const partes = [
          mejor.nombre && "nombre",
          mejor.cedula && "cédula",
          mejor.fechaNacimiento && "fecha de nacimiento",
          mejor.genero && "sexo",
        ].filter(Boolean);
        setEstado(
          partes.length
            ? `✓ Leímos: ${partes.join(", ")}. Verifica los datos abajo.`
            : "No se pudieron leer los datos. Completa los campos manualmente abajo."
        );
      } catch {
        setEstado("No se pudo procesar el archivo. Completa los datos manualmente abajo.");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-brand font-medium cursor-pointer hover:underline">
        📄 Subir cédula (PDF o imagen)
        <input type="file" accept="application/pdf,image/*" onChange={onFile} className="hidden" />
      </label>
      {nombreArchivo && <p className="text-xs text-slate-500 mt-1">Archivo: {nombreArchivo}</p>}
      {estado && <p className="text-xs text-slate-500 mt-1">{estado}</p>}
    </div>
  );
}
