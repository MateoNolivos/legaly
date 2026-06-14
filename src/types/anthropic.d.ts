// El SDK de Anthropic es una dependencia OPCIONAL (solo se usa si configuras
// ANTHROPIC_API_KEY). Esta declaracion permite que el proyecto compile aunque
// el paquete no este instalado; en tiempo de ejecucion se importa de forma
// dinamica y, si no existe, el agente usa el modo reglas.
declare module "@anthropic-ai/sdk";
