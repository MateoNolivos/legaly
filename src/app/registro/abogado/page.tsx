"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import PhotoCapture from "@/components/PhotoCapture";
import LocationPicker, { type Ubicacion } from "@/components/LocationPicker";
import VerificacionIdentidad from "@/components/VerificacionIdentidad";
import { type DatosCedula } from "@/lib/ocrCedula";
import ReferenciasInput, { type Referencia } from "@/components/ReferenciasInput";
import AceptarLegales from "@/components/AceptarLegales";
import { MATERIAS } from "@/lib/constantes";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

const contarPalabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export default function RegistroAbogadoPage() {
  const router = useRouter();
  const [ced, setCed] = useState<DatosCedula>({ nombre: "", cedula: "", fechaNacimiento: "", genero: "" });
  const [cedulaFoto, setCedulaFoto] = useState("");
  const [cedulaReverso, setCedulaReverso] = useState("");
  const [selfie, setSelfie] = useState("");
  const [foto, setFoto] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [matricula, setMatricula] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [especialidades, setEsp] = useState<string[]>([]);
  const [loc, setLoc] = useState<Ubicacion>({ ubicacion: "", lat: null, lng: null });
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [aceptaT, setAceptaT] = useState(false);
  const [aceptaP, setAceptaP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const palabrasBio = contarPalabras(bio);
  const toggleEsp = (m: string) =>
    setEsp((e) => (e.includes(m) ? e.filter((x) => x !== m) : [...e, m]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cedulaFoto) return setError("Captura el FRENTE de tu cédula.");
    if (!cedulaReverso) return setError("Captura el REVERSO de tu cédula.");
    if (!selfie) return setError("Completa la verificación facial (selfie).");
    if (!ced.nombre.trim()) return setError("Confirma tu nombre (lo leemos de la cédula).");
    if (especialidades.length === 0) return setError("Elige al menos una especialidad.");
    if (palabrasBio > 500) return setError("La biografía no puede superar las 500 palabras.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (!aceptaT || !aceptaP) return setError("Debes aceptar los términos y las políticas de privacidad.");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "ABOGADO",
          name: ced.nombre, cedula: ced.cedula,
          fechaNacimiento: ced.fechaNacimiento, genero: ced.genero,
          email, phone, matricula, experiencia, bio, password,
          especialidades, foto, cedulaFoto, cedulaReverso, selfie,
          ubicacion: loc.ubicacion, lat: loc.lat, lng: loc.lng,
          referencias: referencias.filter((r) => r.nombre.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "No se pudo crear la cuenta.");
      router.push("/registro/abogado/enviado");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo size={38} />
          <p className="text-sm text-slate-500 mt-3">Postula como abogado</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Foto de perfil</label>
            <PhotoCapture onCapture={setFoto} shape="circle" alto={90} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Verificación de identidad</label>
            <p className="text-xs text-slate-400 mb-2">Captura el frente y reverso de tu cédula y una selfie.</p>
            <VerificacionIdentidad
              onFrontal={setCedulaFoto}
              onReverso={setCedulaReverso}
              onSelfie={setSelfie}
              onDatos={setCed}
            />
          </div>

          <input className={input} type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Especialidades</label>
            <div className="flex flex-wrap gap-2">
              {MATERIAS.map((m) => (
                <button type="button" key={m} onClick={() => toggleEsp(m)}
                  className={`text-sm rounded-full px-3 py-1 border transition ${
                    especialidades.includes(m) ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-300 hover:border-brand"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="N° de matrícula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
            <input className={input} type="number" min="0" placeholder="Años de exp." value={experiencia} onChange={(e) => setExperiencia(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Ubicación</label>
            <LocationPicker value={loc} onChange={setLoc} />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Biografía profesional{" "}
              <span className={palabrasBio > 500 ? "text-red-600" : "text-slate-400"}>({palabrasBio}/500 palabras)</span>
            </label>
            <textarea className={input} rows={3} placeholder="Cuéntale a tus futuros clientes sobre ti…" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Referencias personales</label>
            <ReferenciasInput value={referencias} onChange={setReferencias} />
          </div>

          <input className={input} type="password" minLength={6} placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <AceptarLegales terminos={aceptaT} privacidad={aceptaP} onTerminos={setAceptaT} onPrivacidad={setAceptaP} />

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-brand text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60">
            {loading ? "Enviando postulación…" : "Enviar postulación"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/registro" className="text-slate-400 hover:underline">← Volver</Link>
        </p>
      </div>
    </main>
  );
}
