"use client";

import { useState } from "react";
import DocumentCapture from "@/components/DocumentCapture";
import {
  procesarCedulaDebug,
  procesarReversoDebug,
  validarCedula,
  type DebugCedula,
} from "@/lib/ocrCedula";

function Resultado({ debug, ms }: { debug: DebugCedula; ms: number }) {
  const campo = (label: string, valor: string, extra?: React.ReactNode) => (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-800 text-right">{valor || "—"} {extra}</span>
    </div>
  );
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        {campo("Nombre", debug.datos.nombre)}
        {campo(
          "Cédula",
          debug.datos.cedula,
          debug.datos.cedula
            ? (validarCedula(debug.datos.cedula)
                ? <span className="text-emerald-600 text-xs font-medium">✓ válida</span>
                : <span className="text-red-600 text-xs font-medium">✗ inválida</span>)
            : null
        )}
        {campo("Fecha nacimiento", debug.datos.fechaNacimiento)}
        {campo("Sexo", debug.datos.genero)}
        {campo("Orientación", `${debug.orientacion}°`)}
        {campo("Tiempo", `${ms} ms`)}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-400 mb-2">Imagen procesada (OCR)</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={debug.procesada} alt="Procesada" className="w-full rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-400 mb-2">Texto crudo</p>
          <pre className="text-[11px] whitespace-pre-wrap text-slate-700 bg-slate-50 rounded-lg p-3 max-h-60 overflow-auto">
            {debug.texto || "(vacío)"}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function PruebaCedulaPage() {
  const [frente, setFrente] = useState<DebugCedula | null>(null);
  const [reverso, setReverso] = useState<DebugCedula | null>(null);
  const [msF, setMsF] = useState(0);
  const [msR, setMsR] = useState(0);
  const [cargF, setCargF] = useState(false);
  const [cargR, setCargR] = useState(false);

  async function analizarFrente(dataUrl: string, esPdf: boolean) {
    setFrente(null); setCargF(true);
    const t0 = performance.now();
    try { setFrente(await procesarCedulaDebug(dataUrl, esPdf)); }
    catch (e) { console.error(e); }
    finally { setMsF(Math.round(performance.now() - t0)); setCargF(false); }
  }

  async function analizarReverso(dataUrl: string, esPdf: boolean) {
    setReverso(null); setCargR(true);
    const t0 = performance.now();
    try { setReverso(await procesarReversoDebug(dataUrl, esPdf)); }
    catch (e) { console.error(e); }
    finally { setMsR(Math.round(performance.now() - t0)); setCargR(false); }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-extrabold text-slate-800">Pruebas de lectura de cédula</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Página solo para pruebas de OCR.</p>

      <section className="mb-8">
        <h2 className="font-display font-bold text-slate-800 mb-2">
          Reverso (MRZ) <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">recomendado</span>
        </h2>
        <p className="text-xs text-slate-400 mb-2">Captura el reverso, con las líneas de símbolos &lt;&lt;&lt; bien visibles.</p>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <DocumentCapture instruccion="Coloca el REVERSO de tu cédula dentro del recuadro" onCapture={analizarReverso} />
        </div>
        {cargR && <p className="text-sm text-slate-500 mt-3">Leyendo MRZ…</p>}
        {reverso && <Resultado debug={reverso} ms={msR} />}
      </section>

      <section>
        <h2 className="font-display font-bold text-slate-800 mb-2">Frente (campos visuales)</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <DocumentCapture instruccion="Coloca el FRENTE de tu cédula dentro del recuadro" onCapture={analizarFrente} />
        </div>
        {cargF && <p className="text-sm text-slate-500 mt-3">Analizando frente…</p>}
        {frente && <Resultado debug={frente} ms={msF} />}
      </section>
    </main>
  );
}
