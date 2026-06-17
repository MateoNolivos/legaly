# Asistente IA del chat híbrido

El chat de cada solicitud es **híbrido**:
- En modo **"ia"**, cuando el cliente escribe, responde el **Asistente** (IA) lo general/administrativo.
- Si la consulta es específica del caso, el asistente **deriva al abogado** (cambia a modo "abogado" y lo notifica).
- El cliente también puede pulsar **"Prefiero hablar con mi abogado"** para derivar de una.
- Cuando el **abogado escribe**, el chat pasa a modo "abogado" y la IA deja de responder.

## Orden de proveedores (con respaldo automático)
1. **Principal: Mac Mini con Ollama** (modelo local, privado).
2. **Respaldo: Groq** (gratis) si el Mac no responde.
3. **Reglas** (siempre disponible, sin costo) si no hay nada configurado.

Si dejas todo vacío en `.env`, funciona con **reglas** — suficiente para el demo.

## Opción A — Mac Mini (principal, recomendado para privacidad)
1. Instala Ollama: https://ollama.com → descarga la app de Mac.
2. Descarga un modelo (en Terminal del Mac):
   ```bash
   ollama pull gemma2
   ```
   (Con 16 GB de RAM, `gemma2` o `llama3.1:8b` van bien.)
3. Ollama ya expone una API OpenAI-compatible en `http://localhost:11434/v1`.
4. Para que tu app publicada (Vercel) llegue al Mac, exponlo con un túnel gratis:
   ```bash
   brew install cloudflared
   cloudflared tunnel --url http://localhost:11434
   ```
   Te da una URL pública tipo `https://algo.trycloudflare.com`.
5. En Vercel (Environment Variables) pon:
   ```
   LLM_PRINCIPAL_URL=https://algo.trycloudflare.com/v1
   LLM_PRINCIPAL_MODELO=gemma2
   LLM_PRINCIPAL_KEY=ollama
   ```
   Redeploy. (En desarrollo local puedes usar `http://localhost:11434/v1` directo.)

## Opción B — Groq (respaldo o demo rápido)
1. Crea cuenta gratis en https://console.groq.com y genera una API key.
2. En `.env` (o Vercel):
   ```
   GROQ_API_KEY=tu_key
   GROQ_MODELO=llama-3.3-70b-versatile
   ```

## Notas
- Es compatible con cualquier proveedor "OpenAI-compatible" (OpenRouter, etc.): cambia `LLM_PRINCIPAL_URL` y el modelo.
- El asistente está instruido para **no dar asesoría legal específica** y derivar al abogado ante la duda (menos riesgo).
- Cada respuesta del asistente se guarda en el chat como mensaje "🤖 Asistente", visible también para el abogado.
