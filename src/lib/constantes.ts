export const MATERIAS = [
  "Civil",
  "Laboral",
  "Penal",
  "Tránsito",
  "Familia",
] as const;

export const URGENCIAS = ["Baja", "Media", "Alta"] as const;

export const GENEROS = ["Femenino", "Masculino", "Otro", "Prefiero no decir"] as const;

export const OCUPACIONES = [
  "Empleado/a en relación de dependencia",
  "Servidor/a público",
  "Comerciante",
  "Emprendedor/a o dueño/a de negocio",
  "Profesional independiente",
  "Estudiante",
  "Jubilado/a",
  "Ama/o de casa",
  "Desempleado/a",
  "Otra",
] as const;

export type Plan = {
  id: string;
  precio: number; // USD / mes
  descuento: number; // % de descuento preferente
  destacado?: boolean;
  resumen: string;
  beneficios: string[];
};

// Planes propuestos (precios sugeridos en USD; ajústalos cuando quieras).
export const PLANES: Plan[] = [
  {
    id: "Básico",
    precio: 2,
    descuento: 0,
    resumen: "Para una necesidad puntual.",
    beneficios: [
      "1 solicitud activa a la vez",
      "Chat con tu abogado asignado",
      "Tiempos de respuesta estándar",
    ],
  },
  {
    id: "Pro",
    precio: 4,
    descuento: 15,
    destacado: true,
    resumen: "Para quien necesita acompañamiento continuo.",
    beneficios: [
      "Hasta 5 solicitudes activas",
      "Prioridad media en la cola",
      "15% de descuento en servicios",
      "Historial completo de tus casos",
    ],
  },
  {
    id: "Gold",
    precio: 6,
    descuento: 30,
    resumen: "La experiencia completa, sin límites.",
    beneficios: [
      "Solicitudes ilimitadas",
      "Prioridad alta (atención más rápida)",
      "30% de descuento en servicios",
      "Abogado dedicado",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANES.find((p) => p.id === id);
}

// Código ASCII del plan para usarlo dentro del clientTransactionId de Payphone.
export function planACodigo(id: string): string {
  return id.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
}

export function codigoAPlan(codigo: string): Plan | undefined {
  return PLANES.find((p) => planACodigo(p.id) === codigo);
}
