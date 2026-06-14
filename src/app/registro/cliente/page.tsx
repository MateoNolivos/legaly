"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import LocationPicker, { type Ubicacion } from "@/components/LocationPicker";
import VerificacionIdentidad from "@/components/VerificacionIdentidad";
import { type DatosCedula } from "@/lib/ocrCedula";
import AceptarLegales from "@/components/AceptarLegales";
import { OCUPACIONES } from "@/lib/constantes";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

export default function RegistroClientePage() {
  const router = useRouter();
  // Datos que salen de la cédula (editables tras el OCR):
  const [ced, setCed] = useState<DatosCedula>({ nombre: "", cedula: "", fechaNacimiento: "", genero: "" });
  const [cedulaFoto, setCedulaFoto] = useState("");
  const [cedulaReverso, setCedulaReverso] = useState("");
  const [selfie, setSelfie] = useState("");
  // Datos que NO están en la cédula:
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ocupacion, setOcupacion] = useState("");
  const [password, setPassword] = useState("");
  const [loc, setLoc] = useState<Ubicacion>({ ubicacion: "", lat: null, lng: null });
  const [aceptaT, setAceptaT] = useState(false);
  const [aceptaP, setAceptaP] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cedulaFoto) return setError("Captura el FRENTE de tu cédula.");
    if (!cedulaReverso) return setError("Captura el REVERSO de tu cédula.");
    if (!selfie) return setError("Completa la verificación facial (selfie).");
    if (!ced.nombre.trim()) return setError("Confirma tu nombre (lo leemos de la cédula).");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (!aceptaT || !aceptaP) return setError("Debes aceptar los términos y las políticas de privacidad.");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "CLIENTE",
          name: ced.nombre,
          cedula: ced.cedula,
          fechaNacimiento: ced.fechaNacimiento,
          genero: ced.genero,
          email, phone, ocupacion, password,
          cedulaFoto, cedulaReverso, selfie,
          ubicacion: loc.ubicacion, lat: loc.lat, lng: loc.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "No se pudo crear la cuenta.");
      router.push("/registro/plan");
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
          <p className="text-sm text-slate-500 mt-3">Registro de cliente</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Verificación de identidad
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Captura el frente y el reverso de tu cédula y una selfie. Leemos tus datos automáticamente.
            </p>
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
            <label className="block text-xs text-slate-500 mb-1">Ocupación</label>
            <select className={input} value={ocupacion} onChange={(e) => setOcupacion(e.target.value)}>
              <option value="">Selecciona…</option>
              {OCUPACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Ubicación</label>
            <LocationPicker value={loc} onChange={setLoc} />
          </div>

          <input className={input} type="password" minLength={6} placeholder="Contraseña (mín. 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <AceptarLegales terminos={aceptaT} privacidad={aceptaP} onTerminos={setAceptaT} onPrivacidad={setAceptaP} />

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-brand text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60">
            {loading ? "Creando…" : "Continuar a elegir plan"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/registro" className="text-slate-400 hover:underline">← Volver</Link>
        </p>
      </div>
    </main>
  );
}
