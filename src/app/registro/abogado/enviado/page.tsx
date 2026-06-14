import Link from "next/link";
import Logo from "@/components/Logo";

export default function PostulacionEnviadaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="flex justify-center mb-5">
          <Logo size={42} />
        </div>
        <div className="text-4xl mb-3">⏳</div>
        <h1 className="text-xl font-display font-extrabold text-slate-800">
          Tu postulación está en revisión
        </h1>
        <p className="text-sm text-slate-500 mt-3">
          Gracias por postular como abogado en LEGALY. Nuestro equipo revisará tus datos,
          documentos y referencias. Te enviaremos por <span className="font-medium text-slate-700">correo electrónico</span> el
          resultado de tu candidatura.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Mientras tanto, no podrás iniciar sesión. Te avisaremos en cuanto tu cuenta sea aprobada.
        </p>

        <Link
          href="/login"
          className="inline-block mt-6 bg-brand text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-brand-dark transition"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
