"use client";

import { useRef, useState } from "react";
import DocumentCapture from "./DocumentCapture";
import SelfieCapture from "./SelfieCapture";
import { procesarCedula, procesarReverso, validarCedula, type DatosCedula } from "@/lib/ocrCedula";
import { GENEROS } from "@/lib/constantes";

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

function Paso({ n, titulo, listo, children }: { n: number; titulo: string; listo: boolean; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium ${listo ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
          {listo ? "✓" : n}
        </span>
        <span className="text-sm font-medium text-slate-700">{titulo}</span>
      </div>
      {children}
    </div>
  );
}

export default function VerificacionIdentidad({
  onFrontal,
  onReverso,
  onSelfie,
  onDatos,
}: {
  onFrontal: (dataUrl: string) => void;
  onReverso: (dataUrl: string) => void;
  onSelfie: (dataUrl: string) => void;
  onDatos: (datos: DatosCedula) => void;
}) {
  const [datos, setDatos] = useState<DatosCedula>({ nombre: "", cedula: "", fechaNacimiento: "", genero: "" });
  const frenteRef = useRef<DatosCedula | null>(null);
  const reversoRef = useRef<DatosCedula | null>(null);
  const [frenteListo, setFrenteListo] = useState(false);
  const [reversoListo, setReversoListo] = useState(false);
  const [selfieListo, setSelfieListo] = useState(false);
  const [estadoF, setEstadoF] = useState("");
  const [estadoR, setEstadoR] = useState("");

  // Combina lo leído del frente (cédula confiable) y del reverso MRZ (nombre, fecha, sexo).
  function combinar() {
    const f = frenteRef.current;
    const r = reversoRef.current;
    const nuevo: DatosCedula = {
      cedula: (f?.cedula || r?.cedula || "").trim(),
      nombre: (r?.nombre || f?.nombre || "").trim(),
      fechaNacimiento: r?.fechaNacimiento || f?.fechaNacimiento || "",
      genero: r?.genero || f?.genero || "",
    };
    setDatos(nuevo);
    onDatos(nuevo);
  }

  async function capFrente(dataUrl: string, esPdf: boolean) {
    onFrontal(dataUrl);
    setFrenteListo(true);
    setEstadoF("Leyendo la cédula…");
    try {
      frenteRef.current = await procesarCedula(dataUrl, esPdf);
      combinar();
      setEstadoF("");
    } catch {
      setEstadoF("No se pudo leer el frente; revisa los datos abajo.");
    }
  }

  async function capReverso(dataUrl: string, esPdf: boolean) {
    onReverso(dataUrl);
    setReversoListo(true);
    setEstadoR("Leyendo el reverso…");
    try {
      reversoRef.current = await procesarReverso(dataUrl, esPdf);
      combinar();
      setEstadoR("");
    } catch {
      setEstadoR("No se pudo leer el reverso; revisa los datos abajo.");
    }
  }

  function editar(k: keyof DatosCedula, v: string) {
    const nuevo = { ...datos, [k]: v };
    setDatos(nuevo);
    onDatos(nuevo);
  }

  return (
    <div className="space-y-3">
      <Paso n={1} titulo="Frente de tu cédula" listo={frenteListo}>
        <DocumentCapture instruccion="Coloca el FRENTE de tu cédula dentro del recuadro" onCapture={capFrente} />
        {estadoF && <p className="text-xs text-slate-500 mt-1">{estadoF}</p>}
      </Paso>

      <Paso n={2} titulo="Reverso de tu cédula" listo={reversoListo}>
        <DocumentCapture instruccion="Coloca el REVERSO de tu cédula dentro del recuadro" onCapture={capReverso} />
        {estadoR && <p className="text-xs text-slate-500 mt-1">{estadoR}</p>}
      </Paso>

      {(frenteListo || reversoListo) && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Verifica y corrige tus datos</p>
          <input className={input} placeholder="Nombre completo" value={datos.nombre} onChange={(e) => editar("nombre", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className={input} placeholder="N° de cédula" value={datos.cedula} onChange={(e) => editar("cedula", e.target.value)} />
            <input className={input} type="date" value={datos.fechaNacimiento} onChange={(e) => editar("fechaNacimiento", e.target.value)} />
          </div>
          <select className={input} value={datos.genero} onChange={(e) => editar("genero", e.target.value)}>
            <option value="">Sexo…</option>
            {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
            {datos.genero && !GENEROS.includes(datos.genero as (typeof GENEROS)[number]) && (
              <option value={datos.genero}>{datos.genero}</option>
            )}
          </select>
          {datos.cedula && (
            validarCedula(datos.cedula)
              ? <p className="text-xs text-emerald-600 font-medium">✓ Cédula verificada</p>
              : <p className="text-xs text-amber-600">⚠ El número de cédula no parece válido, revísalo.</p>
          )}
        </div>
      )}

      <Paso n={3} titulo="Verificación facial (selfie)" listo={selfieListo}>
        <SelfieCapture onCapture={(d) => { onSelfie(d); setSelfieListo(true); }} />
      </Paso>
    </div>
  );
}
