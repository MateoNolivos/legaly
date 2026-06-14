# Publicar LEGALY (gratis) — GitHub + Vercel

La base ya está en Neon (Postgres en la nube). Falta subir el código y publicarlo.

## 1. Subir el código a GitHub
1. Crea una cuenta en https://github.com (si no tienes).
2. Crea un repositorio **privado** llamado `legaly`. NO lo inicialices con README.
3. En la terminal, dentro de la carpeta LEGALY:
   ```bash
   git init
   git add .
   git commit -m "LEGALY MVP"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/legaly.git
   git push -u origin main
   ```
   > El archivo `.env` NO se sube (está en `.gitignore`), así que tus claves quedan seguras.

## 2. Publicar en Vercel
1. Entra a https://vercel.com y regístrate **con tu cuenta de GitHub**.
2. "Add New… → Project" → importa el repo `legaly`.
3. Vercel detecta Next.js automáticamente (no cambies nada del build).
4. Antes de hacer "Deploy", abre **Environment Variables** y agrega (cópialas de tu `.env`):
   - `DATABASE_URL` → la cadena de Neon
   - `SESSION_SECRET` → un texto largo y secreto
   - `NEXT_PUBLIC_PAYPHONE_TOKEN`
   - `NEXT_PUBLIC_PAYPHONE_STORE_ID`
   - `EMAIL_FROM` (opcional) y `RESEND_API_KEY` (opcional)
   - `ANTHROPIC_API_KEY` (opcional)
   - `NEXT_PUBLIC_APP_URL` → por ahora pon `https://legaly.vercel.app` (lo ajustas tras el primer deploy)
5. Clic en **Deploy**. En 1–2 min tendrás una URL tipo `https://legaly-xxxx.vercel.app`.

## 3. Ajustes después del primer deploy
1. Copia tu URL real de Vercel y actualiza `NEXT_PUBLIC_APP_URL` en Vercel con esa URL → vuelve a desplegar (Redeploy).
2. **Payphone (importante):** en Payphone Developer, edita tu app WEB y cambia:
   - **Dominio web** → `https://TU-URL.vercel.app`
   - **URL de respuesta** → `https://TU-URL.vercel.app/pago/confirmacion`
   Si no lo haces, la cajita dará "dominio no permitido".
3. (Opcional) Conecta tu dominio propio `legaly.ec` desde Vercel → Settings → Domains.

## 4. Actualizaciones futuras
Cada vez que cambies el código:
```bash
git add .
git commit -m "describe el cambio"
git push
```
Vercel detecta el push y vuelve a desplegar solo.

## Notas
- Plan gratis de Vercel (Hobby): suficiente para el MVP.
- Neon plan gratis "duerme" tras inactividad; el primer acceso puede tardar 1–2 s.
- Rota la clave de Neon y el token de Payphone para producción (no reutilices las de prueba que compartiste).
- La PWA ya es instalable: en el celular, abre la URL y "Agregar a pantalla de inicio".
