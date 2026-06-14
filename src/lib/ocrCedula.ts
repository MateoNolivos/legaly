// Utilidades de OCR de cédula ecuatoriana (se ejecutan en el navegador).
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

// Umbral adaptativo (local) en el lienzo dado: texto negro nítido sobre blanco.
function umbralAdaptativo(ctx: CanvasRenderingContext2D, W: number, H: number, C = 12) {
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  const gray = new Uint8ClampedArray(W * H);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    gray[j] = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
  }
  const IW = W + 1;
  const integral = new Float64Array(IW * (H + 1));
  for (let y = 1; y <= H; y++) {
    let fila = 0;
    for (let x = 1; x <= W; x++) {
      fila += gray[(y - 1) * W + (x - 1)];
      integral[y * IW + x] = integral[(y - 1) * IW + x] + fila;
    }
  }
  const win = (Math.max(15, Math.floor(W / 28)) | 1);
  const half = (win - 1) / 2;
  for (let y = 0; y < H; y++) {
    const y1 = Math.max(0, y - half);
    const y2 = Math.min(H - 1, y + half);
    for (let x = 0; x < W; x++) {
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(W - 1, x + half);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const s =
        integral[(y2 + 1) * IW + (x2 + 1)] -
        integral[y1 * IW + (x2 + 1)] -
        integral[(y2 + 1) * IW + x1] +
        integral[y1 * IW + x1];
      const mean = s / area;
      const j = y * W + x;
      const v = gray[j] < mean - C ? 0 : 255;
      const i = j * 4;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  }
  ctx.putImageData(id, 0, 0);
}

// Dibuja la imagen rotada y escalada (a color) en un lienzo.
function lienzoRotado(img: HTMLImageElement, deg: number, anchoObjetivo: number): HTMLCanvasElement {
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.scale(escala, escala);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvas;
}

function preparar(img: HTMLImageElement, deg: number, anchoObjetivo = 1600): string {
  const canvas = lienzoRotado(img, deg, anchoObjetivo);
  umbralAdaptativo(canvas.getContext("2d")!, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

// Recorta SOLO la franja inferior (zona MRZ) y la amplía para leerla mejor.
function prepararBandaMRZ(img: HTMLImageElement, deg: number): string {
  const full = lienzoRotado(img, deg, 1400);
  const bandaH = Math.round(full.height * 0.34);
  const sy = full.height - bandaH;
  const escalaB = 2000 / full.width;
  const out = document.createElement("canvas");
  out.width = Math.round(full.width * escalaB);
  out.height = Math.round(bandaH * escalaB);
  const octx = out.getContext("2d")!;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(full, 0, sy, full.width, bandaH, 0, 0, out.width, out.height);
  umbralAdaptativo(octx, out.width, out.height, 14);
  return out.toDataURL("image/png");
}

export async function pdfADataUrl(dataUrl: string): Promise<string> {
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
  const candidatos = t.replace(/[^0-9\s]/g, " ").match(/\b\d{10}\b/g) || [];
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

function puntuar(texto: string, d: DatosCedula): number {
  let p = 0;
  if (d.cedula) p += 3;
  if (d.fechaNacimiento) p += 2;
  if (d.genero) p += 1;
  if (d.nombre) p += 2;
  if (/ECUADOR|CEDULA|IDENTIDAD|NACIONALIDAD/.test(texto.toUpperCase())) p += 1;
  return p;
}

function cargarTesseract(): Promise<any> {
  return loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js").then(
    () => (window as any).Tesseract
  );
}

// Versión de depuración: además de los datos, devuelve el texto crudo del OCR,
// la orientación ganadora y la imagen procesada que se le pasó a Tesseract.
export type DebugCedula = {
  datos: DatosCedula;
  texto: string;
  orientacion: number;
  procesada: string;
  candidatos: string[];
};

export async function procesarCedulaDebug(dataUrl: string, esPdf: boolean): Promise<DebugCedula> {
  const base = esPdf ? await pdfADataUrl(dataUrl) : dataUrl;
  const img = await cargarImagen(base);
  const Tesseract = await cargarTesseract();
  let best = { puntaje: -1, datos: { nombre: "", cedula: "", fechaNacimiento: "", genero: "" } as DatosCedula, texto: "", deg: 0, procesada: "" };
  for (const deg of [0, 90, 270, 180]) {
    const procesada = preparar(img, deg);
    const { data } = await Tesseract.recognize(procesada, "spa");
    const texto = data?.text || "";
    const datos = parseCedula(texto);
    const p = puntuar(texto, datos);
    if (p > best.puntaje) best = { puntaje: p, datos, texto, deg, procesada };
    if (datos.cedula && (datos.fechaNacimiento || datos.genero || datos.nombre)) break;
  }
  const candidatos = (best.texto.toUpperCase().replace(/[^0-9\s]/g, " ").match(/\b\d{10}\b/g) || []);
  return { datos: best.datos, texto: best.texto, orientacion: best.deg, procesada: best.procesada, candidatos };
}

// --- Lectura del REVERSO por MRZ (zona de lectura mecánica) -----------------

// Parsea las líneas MRZ (formato tipo TD1 de la cédula) para sacar los datos.
export function parseMRZ(texto: string): DatosCedula {
  const lineas = texto
    .toUpperCase()
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, ""))
    .filter((l) => l.includes("<") && l.length >= 10);

  const datos: DatosCedula = { nombre: "", cedula: "", fechaNacimiento: "", genero: "" };
  const texAll = lineas.join("\n");

  // Nombre: línea con "<<" formada solo por letras y "<".
  const lineaNombre = lineas.find((l) => l.includes("<<") && /^[A-Z<]+$/.test(l));
  if (lineaNombre) {
    const [ape, nom] = lineaNombre.split("<<");
    const apellidos = (ape || "").replace(/</g, " ").trim();
    const nombres = (nom || "").replace(/</g, " ").trim();
    datos.nombre = `${nombres} ${apellidos}`.replace(/\s+/g, " ").trim();
  }

  // Fecha de nacimiento (YYMMDD) + sexo.
  const fs = texAll.match(/(\d{6})\d?([MFX])/);
  if (fs) {
    const yy = parseInt(fs[1].slice(0, 2), 10);
    const mm = fs[1].slice(2, 4);
    const dd = fs[1].slice(4, 6);
    const year = yy <= 30 ? 2000 + yy : 1900 + yy;
    datos.fechaNacimiento = `${year}-${mm}-${dd}`;
    datos.genero = fs[2] === "F" ? "Femenino" : fs[2] === "M" ? "Masculino" : "";
  }

  // Cédula: número de 10 dígitos válido dentro del MRZ.
  const cands = texAll.replace(/[^0-9\s\n]/g, " ").match(/\b\d{10}\b/g) || [];
  datos.cedula = cands.find(validarCedula) || cands[0] || "";

  return datos;
}

export async function procesarReversoDebug(dataUrl: string, esPdf: boolean): Promise<DebugCedula> {
  const base = esPdf ? await pdfADataUrl(dataUrl) : dataUrl;
  const img = await cargarImagen(base);
  const Tesseract = await cargarTesseract();
  // Worker con lista blanca de caracteres MRZ (mejora mucho la lectura).
  const worker = await Tesseract.createWorker("eng");
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
    tessedit_pageseg_mode: "6",
  });

  const score = (d: DatosCedula) =>
    (d.cedula ? 3 : 0) + (d.fechaNacimiento ? 2 : 0) + (d.genero ? 1 : 0) + (d.nombre ? 2 : 0);

  let best = { puntaje: -1, datos: { nombre: "", cedula: "", fechaNacimiento: "", genero: "" } as DatosCedula, texto: "", deg: 0, procesada: "" };
  try {
    // Pasada 1: imagen completa en 4 orientaciones para hallar la correcta.
    for (const deg of [0, 90, 270, 180]) {
      const procesada = preparar(img, deg);
      const { data } = await worker.recognize(procesada);
      const datos = parseMRZ(data?.text || "");
      const p = score(datos);
      if (p > best.puntaje) best = { puntaje: p, datos, texto: data?.text || "", deg, procesada };
      if (datos.cedula && datos.fechaNacimiento && datos.nombre) break;
    }
    // Pasada 2: recorta y amplía solo la banda MRZ en la mejor orientación.
    const banda = prepararBandaMRZ(img, best.deg);
    const { data: db } = await worker.recognize(banda);
    const datosB = parseMRZ(db?.text || "");
    const combinado: DatosCedula = {
      nombre: datosB.nombre || best.datos.nombre,
      cedula: datosB.cedula || best.datos.cedula,
      fechaNacimiento: datosB.fechaNacimiento || best.datos.fechaNacimiento,
      genero: datosB.genero || best.datos.genero,
    };
    best = {
      puntaje: score(combinado),
      datos: combinado,
      texto: `[BANDA MRZ]\n${db?.text || ""}\n\n[COMPLETA]\n${best.texto}`,
      deg: best.deg,
      procesada: banda,
    };
  } finally {
    await worker.terminate();
  }
  const candidatos = (best.texto.replace(/[^0-9\s]/g, " ").match(/\b\d{10}\b/g) || []);
  return { datos: best.datos, texto: best.texto, orientacion: best.deg, procesada: best.procesada, candidatos };
}

// Lee el reverso por MRZ y devuelve solo los datos (sin info de depuración).
export async function procesarReverso(dataUrl: string, esPdf: boolean): Promise<DatosCedula> {
  return (await procesarReversoDebug(dataUrl, esPdf)).datos;
}

// Procesa la imagen/PDF del FRENTE de la cédula y devuelve los datos leídos.
export async function procesarCedula(dataUrl: string, esPdf: boolean): Promise<DatosCedula> {
  const base = esPdf ? await pdfADataUrl(dataUrl) : dataUrl;
  const img = await cargarImagen(base);
  const Tesseract = await cargarTesseract();
  let mejor: DatosCedula = { nombre: "", cedula: "", fechaNacimiento: "", genero: "" };
  let mejorPuntaje = -1;
  for (const deg of [0, 90, 270, 180]) {
    const procesada = preparar(img, deg);
    const { data } = await Tesseract.recognize(procesada, "spa");
    const datos = parseCedula(data?.text || "");
    const p = puntuar(data?.text || "", datos);
    if (p > mejorPuntaje) {
      mejorPuntaje = p;
      mejor = datos;
    }
    if (datos.cedula && (datos.fechaNacimiento || datos.genero || datos.nombre)) break;
  }
  return mejor;
}
