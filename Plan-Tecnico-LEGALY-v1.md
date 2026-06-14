# Plan Técnico LEGALY — v1 (MVP)

**Contexto:** App web responsive para Ecuador. Abogados ofrecen servicios por suscripción con descuentos preferentes. Incluye un agente que atiende requerimientos administrativos de los clientes ("¿qué día es mi audiencia?", "¿en qué paso está mi proceso?"). Por ahora el estado de los procesos se carga **manualmente**. Pagos se deciden en una fase posterior. Fundador no técnico → el plan prioriza herramientas simples y que tú puedas mantener.

---

## 1. Qué SÍ y qué NO entra en la v1

La regla de oro de un MVP: lanzar lo mínimo que pruebe que la gente lo quiere y paga.

**Sí (v1):**
- Registro / login de clientes y abogados.
- Que un abogado (o un admin tuyo) cargue casos y los actualice: número de expediente, materia, juzgado, próximas audiencias, último movimiento.
- El agente que responde preguntas administrativas del cliente sobre SUS casos.
- Panel del cliente para ver sus casos sin tener que preguntar.

**No (queda para después):**
- Cobros automáticos / pasarela de pago (lo manejas manual o por transferencia al inicio).
- Integración automática con la Función Judicial (SATJE) — eso es la fase 2, cuando ya tengas usuarios.
- App móvil nativa, sistema de descuentos complejo, chat abogado-cliente, etc.

> Por qué: lo único que hace especial a LEGALY es el agente + el estado del proceso. Todo lo demás (login, suscripciones) es código resuelto mil veces. Validemos el corazón primero.

---

## 2. Arquitectura explicada simple

Piensa en 4 piezas:

1. **La pantalla (frontend):** lo que el usuario ve en el navegador. Una web que se adapta a celular y computadora.
2. **La base de datos:** una hoja de cálculo gigante e inteligente donde viven los usuarios, casos, audiencias y movimientos.
3. **El cerebro / agente:** recibe la pregunta del cliente, busca en la base de datos SOLO los casos de ese cliente, y redacta una respuesta clara.
4. **La autenticación:** asegura que cada quien solo ve lo suyo (un cliente no puede ver casos de otro).

El agente NO adivina nada. Solo lee lo que el abogado cargó y lo explica en lenguaje natural. Si el dato no está cargado, responde "aún no hay información registrada" — nunca inventa una fecha.

---

## 3. Stack recomendado (para alguien no técnico)

Te recomiendo construirlo con un **generador de apps con IA** sobre una base de datos lista para usar. Obtienes una app real (que es tuya y puedes exportar), sin tener que programar desde cero.

| Pieza | Herramienta recomendada | Por qué |
|---|---|---|
| Construcción de la web | **Lovable** o **Bolt.new** (generan React describiendo en español lo que quieres) | Le hablas en lenguaje normal y arma las pantallas. App real y exportable. |
| Base de datos + login | **Supabase** | Gratis para empezar, incluye login y permisos por usuario. Se conecta nativo con Lovable/Bolt. |
| El agente | **API de Claude o OpenAI** conectada a la base | El agente lee los casos del cliente y responde. |
| Hosting | **Vercel** (o el propio de Lovable) | Publicar la web con un clic. |

**Alternativa aún más simple (sin nada de código):** si quieres validar la idea en días, **Glide** o **Softr** sobre una tabla de **Airtable** te da panel de casos + login sin programar. El agente quedaría más básico (búsqueda + botones en vez de chat libre), pero sirve para probar el modelo de negocio antes de invertir en construir.

> Mi sugerencia: empieza por Lovable + Supabase. Te da algo real sin programar, pero con espacio para crecer hacia la integración judicial después.

---

## 4. Modelo de datos (las "tablas" clave)

Estas son las tablas mínimas. No te preocupes por la sintaxis, es para que entiendas qué guarda cada cosa.

- **usuarios** — nombre, email, teléfono, rol (cliente / abogado / admin).
- **abogados** — datos profesionales, especialidad, vínculo al usuario.
- **suscripciones** — tipo de plan, fecha inicio/fin, estado, descuento aplicado.
- **casos** — nº de expediente, materia (civil, penal, laboral…), juzgado, cliente, abogado asignado, estado actual.
- **audiencias** — caso, fecha, hora, lugar/modalidad, tipo de audiencia.
- **movimientos** — caso, fecha, descripción del último paso procesal, quién lo cargó.

El agente responde combinando **casos + audiencias + movimientos** del cliente que está preguntando.

---

## 5. El agente paso a paso

1. El cliente escribe: *"¿Cuándo es mi próxima audiencia?"*
2. El sistema ya sabe quién es (está logueado) → busca solo SUS casos.
3. Consulta la tabla **audiencias** ordenada por fecha futura más cercana.
4. El modelo de IA redacta: *"Tu próxima audiencia es el martes 23 de junio a las 09:00 en el Juzgado X, modalidad telemática."*
5. Si no hay dato cargado → *"Todavía no tengo registrada una audiencia para tu caso. Tu abogado la cargará cuando esté agendada."*

**Truco para la v1:** antes de un chat 100% libre, puedes ofrecer botones ("Ver próxima audiencia", "Ver último movimiento", "Estado del proceso"). Es más confiable, más barato y la gente lo entiende igual. El chat libre lo agregas cuando ya funcione lo básico.

---

## 6. Roadmap por fases

**Fase 0 — Diseño (semana 1)**
Definir las pantallas en papel/Figma: login, panel del cliente, panel del abogado para cargar casos, vista del agente.

**Fase 1 — MVP funcional (semanas 2–5)**
Base de datos + login + carga manual de casos + panel del cliente + agente con botones. Sin pagos (suscripción manual).

**Fase 2 — Validación (semanas 6–8)**
Probar con 3–5 abogados reales y sus clientes. Medir: ¿reduce las llamadas administrativas al abogado? ¿los clientes usan el agente?

**Fase 3 — Monetización y escala (mes 3+)**
Integrar pasarela local (Payphone, Datafast o Kushki), sistema de descuentos por plan, y empezar a explorar la integración automática con la Función Judicial para dejar de cargar a mano.

---

## 7. Costos aproximados para empezar

- Supabase: **gratis** hasta cierto uso.
- Lovable/Bolt: plan gratis para probar, ~**$20–25/mes** para uso serio.
- API de IA (agente): **centavos por consulta**; con pocos usuarios, pocos dólares al mes.
- Hosting (Vercel): **gratis** al inicio.
- Dominio (legaly.ec o .com): ~**$10–15/año**.

Puedes tener un MVP corriendo por menos de **$50/mes**.

---

## 8. Primeros pasos concretos (esta semana)

1. Crear cuenta gratis en **Supabase** y en **Lovable** (o Airtable + Glide si prefieres la vía sin código).
2. Dibujar las 4 pantallas clave (no tiene que ser bonito, solo claro).
3. Crear las tablas del punto 4 con 2–3 casos de ejemplo cargados a mano.
4. Pedirle a Lovable que arme el login y el panel del cliente.
5. Conectar el agente para que responda "próxima audiencia" desde esos datos de ejemplo.

Con eso ya tienes una demo que le puedes mostrar a un abogado para validar si lo pagaría.

---

### Decisión pendiente clave (fase 2)
La fuente de datos. Mientras sea manual, el costo está en que **alguien tiene que mantener los casos actualizados**. Define desde ya: ¿lo carga el abogado, un asistente tuyo, o un admin de LEGALY? Eso determina qué tan usable es el producto en la práctica.
