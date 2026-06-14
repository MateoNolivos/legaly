// Formateo de fechas en español (Ecuador).
const TZ = "America/Guayaquil";

export function formatFechaHora(date: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export function formatFecha(date: Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

// Formatea una duracion en milisegundos a algo legible: "8 min", "2 h 15 min", "3 d".
export function formatDuracion(ms: number | null): string {
  if (ms === null) return "—";
  const min = Math.round(ms / 60000);
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) {
    const resto = min % 60;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
  }
  const dias = Math.floor(horas / 24);
  const restoH = horas % 24;
  return restoH ? `${dias} d ${restoH} h` : `${dias} d`;
}

// Devuelve algo como "en 5 días" o "hace 2 días".
export function relativo(date: Date): string {
  const ms = date.getTime() - Date.now();
  const dias = Math.round(ms / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (Math.abs(dias) < 1) return "hoy";
  return rtf.format(dias, "day");
}
