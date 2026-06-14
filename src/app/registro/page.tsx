import Link from "next/link";
import Logo from "@/components/Logo";

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size={44} />
          <p className="text-sm text-slate-500 mt-3">Crea tu cuenta</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/registro/cliente"
            className="block bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand transition"
          >
            <p className="text-2xl mb-2">🙋</p>
            <p className="font-display font-bold text-slate-800">Soy cliente</p>
            <p className="text-sm text-slate-500 mt-1">
              Necesito ayuda legal y quiero que un abogado me atienda.
            </p>
          </Link>

          <Link
            href="/registro/abogado"
            className="block bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand transition"
          >
            <p className="text-2xl mb-2">⚖️</p>
            <p className="font-display font-bold text-slate-800">Soy abogado</p>
            <p className="text-sm text-slate-500 mt-1">
              Quiero atender clientes y recibir solicitudes asignadas.
            </p>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
