import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Términos y condiciones · LEGALY" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/registro" className="text-slate-400 hover:text-slate-700 text-sm">← Volver</Link>
          <Logo size={26} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 prose-legaly">
        <h1 className="text-2xl font-display font-extrabold text-slate-800">Términos y condiciones</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">Última actualización: junio de 2026</p>

        <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">1. Qué es LEGALY</h2>
            <p>LEGALY es una plataforma digital que conecta a personas que necesitan asistencia legal con abogados independientes que prestan sus servicios a través de la aplicación. LEGALY facilita el contacto, la asignación y la comunicación, pero no es un estudio jurídico ni presta directamente servicios legales.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">2. Uso de la cuenta</h2>
            <p>Para usar LEGALY debes registrarte con datos verídicos y mantener la confidencialidad de tu contraseña. Eres responsable de la actividad realizada desde tu cuenta. Los abogados que se postulan quedan sujetos a un proceso de revisión y aprobación antes de poder atender solicitudes.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">3. Relación entre cliente y abogado</h2>
            <p>La relación profesional se establece entre el cliente y el abogado asignado. LEGALY no garantiza resultados de ningún proceso ni se responsabiliza por la calidad, oportunidad o consecuencias del asesoramiento brindado por los abogados, sin perjuicio de los mecanismos de calidad y supervisión que la plataforma implemente.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">4. Planes y pagos</h2>
            <p>El acceso a ciertas funciones requiere una suscripción (Básico, Pro o Gold). Los precios se muestran en la aplicación y pueden cambiar con previo aviso. Los descuentos preferentes aplican según el plan contratado.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">5. Conducta del usuario</h2>
            <p>Te comprometes a no usar la plataforma para fines ilícitos, a no suplantar identidades y a tratar con respeto a los demás usuarios y abogados. LEGALY puede suspender cuentas que incumplan estos términos.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">6. Limitación de responsabilidad</h2>
            <p>LEGALY se ofrece "tal cual". En la medida permitida por la ley, LEGALY no será responsable por daños indirectos derivados del uso de la plataforma.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-1">7. Cambios y contacto</h2>
            <p>Podemos actualizar estos términos; te avisaremos de cambios relevantes. Para consultas, escríbenos a soporte@legaly.ec.</p>
          </section>

          <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
            Este documento es una base general y debe ser revisado y validado por un profesional del derecho antes de su uso en producción.
          </p>
        </div>
      </main>
    </div>
  );
}
