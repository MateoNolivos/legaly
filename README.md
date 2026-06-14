# LEGALY — MVP

Plataforma legal para Ecuador. El cliente se registra, crea una **solicitud de ayuda** con un cuestionario simple, el sistema la **asigna automáticamente** a un abogado (por especialidad y carga) y ambos conversan en un **chat**. Se miden los **tiempos de respuesta** del abogado.

## Stack
- **Next.js 14** (App Router) + **React** + **TypeScript**
- **Prisma** + **SQLite** (un archivo local; fácil de migrar a Postgres/Supabase)
- **Tailwind CSS** (marca: verde esmeralda, tipografías Plus Jakarta Sans + Inter)

## Cómo correrlo

Necesitas tener Node.js instalado (versión 18 o superior).

```bash
# 1. Instalar dependencias
npm install

# 2. Crear/actualizar la base de datos y cargar datos de ejemplo
npm run setup

# 3. Levantar la app
npm run dev
```

Abre http://localhost:3000

> Si ya lo tenías corriendo y actualizaste el código, vuelve a correr `npm run setup` para aplicar los cambios de base de datos y recargar los datos de ejemplo.

### Usuarios de prueba (contraseña: `legaly123`)

ADMIN / SUPERVISOR:
- `admin@legaly.ec` — ve **todas** las solicitudes, el desempeño de cada abogado y las métricas globales.

CLIENTES:
- `cliente@legaly.ec` — Juan (tiene solicitudes con chat)
- `maria@legaly.ec` — María

ABOGADOS:
- `abogada@legaly.ec` — Dra. Carla Jiménez (Civil, Laboral)
- `diego@legaly.ec` — Ab. Diego Andrade (Penal, Tránsito)
- `sofia@legaly.ec` — Dra. Sofía Vega (Familia, Civil)

También puedes **registrarte** como cliente o abogado desde la pantalla de ingreso.

> ¿Ya tenías datos cargados y no quieres perderlos? Para crear solo el usuario supervisor sin borrar nada, corre `npm run admin`.

## Cómo funciona el flujo
1. El cliente entra y pulsa **"Necesito ayuda"** → completa un cuestionario (tipo de necesidad, descripción, urgencia, ciudad y teléfono).
2. La solicitud se **asigna automáticamente** al abogado cuya especialidad coincide con la materia; si hay varios, al de **menor carga**.
3. El cliente ve el **estado** de sus solicitudes y conversa con su abogado en el **chat**.
4. El abogado ve su **cola de solicitudes asignadas** y sus **métricas**: tiempo de primera respuesta y tiempo promedio de respuesta en el chat.

## Asignación automática
La lógica está en `src/lib/asignacion.ts`: filtra abogados por especialidad que incluya la materia y elige al de menor carga activa. Para cambiar el criterio, edita ese archivo.

## Métricas de tiempo
En `src/lib/solicitudes.ts`:
- **Primera respuesta**: desde que entra la solicitud hasta el primer mensaje del abogado.
- **Promedio de respuesta**: tiempo medio que tarda el abogado en contestar a cada mensaje del cliente.

## Estructura
```
prisma/
  schema.prisma     # modelo de datos (User, Solicitud, Mensaje, ...)
  seed.ts           # datos de ejemplo
src/
  lib/              # db, auth, asignacion, solicitudes, helpers
  components/       # Logo, Header, Chat, Badges
  app/
    login, registro/        # ingreso y alta de clientes
    cliente/                # mis solicitudes, /nueva (cuestionario), /solicitud/[id]
    abogado/                # cola + métricas, /solicitud/[id]
    api/                    # login, register, logout, solicitudes, mensajes
brand/                # logo, ícono y manual de marca
```

> Nota: el "asistente" anterior (preguntas sobre audiencias y casos) sigue en el código (`/cliente/agente`, modelo `Caso`) pero quedó fuera del flujo principal. Se puede retomar en una fase posterior.

## Próximos pasos sugeridos
1. Pasar de SQLite a Postgres/Supabase para producción.
2. Agregar pasarela de pago local (Payphone, Datafast, Kushki) para las suscripciones y descuentos.
3. Notificaciones (correo / push) cuando se asigna una solicitud o llega un mensaje.
4. Mejorar el chat con tiempo real (WebSockets) en lugar de actualización por intervalos.
