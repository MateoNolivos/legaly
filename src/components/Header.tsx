import Link from "next/link";
import Logo from "./Logo";
import Avatar from "./Avatar";
import LogoutButton from "./LogoutButton";
import NotificacionesBell from "./NotificacionesBell";

export default function Header({
  nombre,
  subtitulo,
}: {
  nombre: string;
  subtitulo?: string;
}) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size={30} />
        </Link>
        <div className="flex items-center gap-3">
          <NotificacionesBell />
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{nombre}</p>
            {subtitulo && <p className="text-xs text-slate-400">{subtitulo}</p>}
          </div>
          <Avatar name={nombre} size={36} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
