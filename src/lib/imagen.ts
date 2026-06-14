// Comprime/redimensiona una imagen (data URL) en el navegador antes de subirla,
// para que no pese demasiado. Los PDF u otros formatos se devuelven sin cambios.
export function comprimirImagen(
  dataUrl: string,
  maxLado = 1280,
  calidad = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const escala = Math.min(1, maxLado / Math.max(w, h));
      const cw = Math.round(w * escala);
      const ch = Math.round(h * escala);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
