"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import PhotoCapture from "./PhotoCapture";
import LocationPicker, { type Ubicacion } from "./LocationPicker";
import ReferenciasInput, { type Referencia } from "./ReferenciasInput";
import { MATERIAS } from "@/lib/constantes";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

const contarPalabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

type Inicial = {
  nombre: string;
  email: string;
  cedula: string;
  genero: string;
  foto: string;
  phone: string;
  ubicacion: string;
  lat: number | null;
  lng: number | null;
  especialidades: string[];
  matricula: string;
  experiencia: string;
  bio: string;
  referencias: Referencia[];
};

function Modulo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

export default function PerfilAbogadoEditor({ inicial }: { inicial: Inicial }) {
  const [foto, setFoto] = useState(inicial.foto);
  const [phone, setPhone] = useState(inicial.phone);
  const [loc, setLoc] = useState<Ubicacion>({ ubicacion: inicial.ubicacion, lat: inicial.lat, lng: inicial.lng });
  const [especialidades, setEsp] = useState<string[]>(inicial.especialidades);
  const [matricula, setMatricula] = useState(inicial.matricula);
  const [experiencia, setExperiencia] = useState(inicial.experiencia);
  const [bio, setBio] = useState(inicial.bio);
  const [referencias, setReferencias] = useState<Referencia[]>(inicial.referencias);
  const [editandoFoto, setEditandoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState("");

  const palabrasBio = contarPalabras(bio);
  const toggleEsp = (m: string) =>
    setEsp((e) => (e.includes(m) ? e.filter((x) => x !== m) : [...e, m]));

  async function guardar() {
    setMsg("");
    if (especialidades.length === 0) return setMsg("Elige al menos una especialidad.");
    if (palabrasBio > 500) return setMsg("La biografía no puede superar las 500 palabras.");
    setGuardando(true);
    try {
      const res = await fetch("/api/perfil/abogado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foto, phone, ubicacion: loc.ubicacion, lat: loc.lat, lng: loc.lng,
          especialidades, matricula, experiencia, bio,
          referencias: referencias.filter((r) => r.nombre.trim()),
        }),
      });
      const data = await res.json();
      setMsg(res.ok ? "✓ Cambios guardados" : data.error || "No se pudo guardar.");
    } catch {
      setMsg("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Identidad (no editable: viene de la verificación) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <Avatar foto={foto} name={inicial.nombre} size={68} />
          <div className="flex-1">
            <h1 className="text-xl font-display font-extrabold text-slate-800">{inicial.nombre}</h1>
            <p className="text-sm text-slate-500">{inicial.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              {inicial.cedula ? `Cédula ${inicial.cedula}` : ""}{inicial.genero ? ` · ${inicial.genero}` : ""}
            </p>
            <button type="button" onClick={() => setEditandoFoto((v) => !v)} className="text-xs text-brand font-medium hover:underline mt-2">
              {editandoFoto ? "Cancelar" : "Cambiar foto"}
            </button>
          </div>
        </div>
        {editandoFoto && (
          <div className="mt-3">
            <PhotoCapture onCapture={(d) => { setFoto(d); setEditandoFoto(false); }} shape="circle" alto={90} />
          </div>
        )}
      </div>

      <Modulo titulo="Contacto y ubicación">
        <label className="block text-xs text-slate-500 mb-1">Teléfono</label>
        <input className={`${input} mb-3`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09…" />
        <label className="block text-xs text-slate-500 mb-1">Ubicación</label>
        <LocationPicker value={loc} onChange={setLoc} />
      </Modulo>

      <Modulo titulo="Información profesional">
        <label className="block text-xs text-slate-500 mb-1.5">Especialidades</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {MATERIAS.map((m) => (
            <button type="button" key={m} onClick={() => toggleEsp(m)}
              className={`text-sm rounded-full px-3 py-1 border transition ${
                especialidades.includes(m) ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-300 hover:border-brand"
              }`}>
              {m}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">N° de matrícula</label>
            <input className={input} value={matricula} onChange={(e) => setMatricula(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Años de experiencia</label>
            <input className={input} type="number" min="0" value={experiencia} onChange={(e) => setExperiencia(e.target.value)} />
          </div>
        </div>
        <label className="block text-xs text-slate-500 mb-1">
          Biografía <span className={palabrasBio > 500 ? "text-red-600" : "text-slate-400"}>({palabrasBio}/500)</span>
        </label>
        <textarea className={input} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Modulo>

      <Modulo titulo="Referencias personales">
        <ReferenciasInput value={referencias} onChange={setReferencias} />
      </Modulo>

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.startsWith("✓") ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>{msg}</p>
      )}

      <button onClick={guardar} disabled={guardando} className="w-full bg-brand text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60">
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}
