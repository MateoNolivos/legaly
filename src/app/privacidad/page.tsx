import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Políticas de privacidad · LEGALY" };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/registro" className="text-slate-400 hover:text-slate-700 text-sm">← Volver</Link>
          <Logo size={26} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-extrabold text-slate-800">Políticas de privacidad y protección de datos</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">Última actualización: junio de 2026</p>

        <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">1. Responsable</h2>
            <p>LEGALY es responsable del tratamiento de los datos personales que recopila a través de la plataforma, conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">2. Qué datos recopilamos</h2>
            <p>Recopilamos los datos que nos proporcionas al registrarte y usar la app: nombre, número de cédula e imagen del documento, fecha de nacimiento, sexo, correo, teléfono, ubicación, ocupación y, en el caso de abogados, datos profesionales, foto y referencias. También guardamos las solicitudes y los mensajes del chat.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">3. Para qué los usamos</h2>
            <p>Usamos tus datos para crear y gestionar tu cuenta, asignarte el abogado adecuado, permitir la comunicación, verificar identidades, medir la calidad del servicio y cumplir obligaciones legales. No vendemos tus datos a terceros.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">4. Documento de identidad y OCR</h2>
            <p>La imagen o PDF de tu cédula se utiliza para verificar tu identidad y completar tus datos automáticamente. Se almacena de forma segura y solo el personal autorizado y el abogado asignado (cuando corresponda) pueden acceder a la información necesaria.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">5. Tus derechos</h2>
            <p>Tienes derecho a acceder, rectificar, actualizar, eliminar y oponerte al tratamiento de tus datos, así como a la portabilidad, conforme a la LOPDP. Puedes ejercerlos escribiendo a privacidad@legaly.ec.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">6. Conservación y seguridad</h2>
            <p>Conservamos tus datos mientras tu cuenta esté activa o según lo exija la ley. Aplicamos medidas técnicas y organizativas razonables para protegerlos.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">7. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad, escríbenos a privacidad@legaly.ec.</p>
          </section>

          <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
            Este documento es una base general y debe ser revisado y validado por un profesional del derecho antes de su uso en producción.
          </p>
        </div>
      </main>
    </div>
  );
}
