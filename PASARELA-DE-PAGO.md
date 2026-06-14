# Pasarelas de pago para LEGALY (Ecuador)

Investigación de junio de 2026 para activar el cobro de los planes (Básico, Pro, Gold).

## Estado actual
**Payphone (Cajita de Pagos) ya está integrado en el código.** Solo falta pegar tus credenciales para activarlo. Flujo implementado:

1. El cliente elige plan → pantalla `/pago` muestra la **Cajita de Pagos** de Payphone con el monto del plan.
2. El cliente paga con tarjeta o saldo Payphone, sin salir de LEGALY.
3. Payphone redirige a `/pago/confirmacion`, que llama a nuestro endpoint `/api/pago/confirmar`.
4. El servidor confirma la transacción con Payphone (`api/confirm`). Si `statusCode = 3` (aprobada), se crea/activa la `Suscripcion`.

Mientras NO pongas las credenciales, la pantalla de pago muestra un botón de **"modo prueba"** que activa el plan sin cobrar, para que puedas seguir probando el resto de la app.

### Cómo activarlo (con tu cuenta Payphone)
1. En **Payphone Developer**, crea una aplicación de **tipo "WEB"**.
2. Configura el **Dominio** y la **URL de respuesta**:
   - Desarrollo: `http://localhost:3000/pago/confirmacion`
   - Producción: `https://TU_DOMINIO/pago/confirmacion`
3. Copia el **Token** y el **Store ID** al archivo `.env`:
   ```
   NEXT_PUBLIC_PAYPHONE_TOKEN="tu_token"
   NEXT_PUBLIC_PAYPHONE_STORE_ID="tu_store_id"
   ```
4. Reinicia `npm run dev`. La cajita aparecerá automáticamente en `/pago`.
5. Prueba primero en el **entorno de pruebas** de Payphone (todas las transacciones se aprueban, sin cobro real), invitando "probadores" desde la app.

### Detalles técnicos de la integración
- La cajita carga desde `cdn.payphonetodoesposible.com/box/v2.0/`.
- Los montos van en **centavos** (Básico=200, Pro=400, Gold=600). Los planes no llevan impuesto, así que `amountWithoutTax = amount`.
- El plan se codifica dentro del `clientTransactionId` (`LG-<plan>-<timestamp>`) para reconocerlo al confirmar.
- Confirmación: `POST https://paymentbox.payphonetodoesposible.com/api/confirm` con `{ id, clientTxId }` y `Authorization: Bearer <token>`.
- ⚠️ La cajita está **atada al dominio** que configures; en otro dominio dará "acceso denegado".
- ⚠️ Hay que confirmar dentro de **5 minutos** o Payphone reversa el pago automáticamente (ya lo hacemos al instante).

### Cobros recurrentes (mensualidad)
La cajita cobra **una vez**. Para el cobro mensual automático, Payphone ofrece **tokenización de tarjetas** (guarda un `cardToken` y tú implementas la recurrencia). Requiere autorización previa de Payphone. Es el siguiente paso cuando quieras cobro automático cada mes.

## Comparativa (sin mensualidad fija)

| Pasarela | Comisión por transacción | Mensualidad | Integración para devs | Notas |
|---|---|---|---|---|
| **Payphone** | ~5% + IVA al cobrar (6% al pasar de billetera a banco) | No | Buena: creas una app tipo "API" en el portal de desarrollador, sin proceso de certificación | Cobro por número de celular o tarjeta (Visa, Mastercard, Diners, Discover). Muy popular en Ecuador. |
| **Paymentez (Nuvei)** | ~1.5% + IVA | No | API REST; soporta tarjetas, pagos diferidos y transferencias | La comisión más baja; bueno si esperas volumen. |
| **Kushki** | Negociable | Según plan | Robusta, nivel bancario; plugins e-commerce | Mejor para escala/empresa; setup más formal. |
| **Datafast (Datalink)** | Según contrato | Según contrato | API Dataweb 2.0 + 3DS; QA bancario de 3–5 días | La más tradicional/bancaria; links de pago y recurrentes. |

## Recomendación para arrancar
**Payphone** para el MVP: no tiene mensualidad, el registro de desarrollador es ágil (no exige certificación de terceros para salir a producción) y es muy reconocido por los usuarios ecuatorianos. Si más adelante el volumen crece y la comisión del 5% pesa, evaluar **Paymentez (1.5%)**.

> Importante: los planes son de $2, $4 y $6/mes. Con comisiones porcentuales, el costo por transacción es bajo en términos absolutos, pero revisa si la pasarela tiene un **mínimo por transacción** (algunas cobran un piso que en montos tan pequeños puede doler). Conviene confirmarlo con el asesor de la pasarela antes de fijar precios definitivos.

## Cómo lo conectaríamos (cuando tengas la cuenta)
1. Creas la aplicación en el portal de desarrollador de Payphone y obtienes el **token** y el **Store ID**.
2. Los guardas en `.env` como `PAYPHONE_TOKEN` y `PAYPHONE_STORE_ID` (no se suben al repositorio).
3. En la pantalla de planes (`/registro/plan`), al confirmar, en vez de solo guardar el plan, el backend genera un **link/botón de pago** por el valor del plan y redirige al cliente.
4. Payphone confirma el pago a una **URL de respuesta** (webhook) en `/api/pago/confirmacion`, y ahí marcamos la `Suscripcion` como pagada y activa.
5. Para cobros mensuales recurrentes se usa la solución de **links/cobros automáticos**.

Documentación de referencia: https://docs.payphone.app/

## Suscripciones recurrentes
El cobro mensual automático (no solo un pago único) es un punto a confirmar con la pasarela: Payphone y Datafast ofrecen cobros recurrentes/links automáticos. Hay que definir si LEGALY guarda el medio de pago y reintenta cada mes, o si el cliente paga manualmente cada periodo.

## Fuentes
- [Pasarelas de Pago Ecuador 2026: PayPhone, Kushki y Datafast — NM Tech Studio](https://www.nmtechstudio.com/blog/pasarelas-pago-ecuador-2026-comparativa)
- [Payphone — sitio oficial](https://payphone.app/)
- [Payphone — API de links de pago](https://payphone.app/soluciones/api-link)
- [Payphone — documentación para desarrolladores](https://docs.payphone.app/)
- [6 Mejores pasarelas de pago en Ecuador: Tarifas y Requisitos — Vivoken](https://vivoken.com/blog/mejores-pasarelas-de-pago-en-ecuador/)
