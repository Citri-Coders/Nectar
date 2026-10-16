// Tipos que reflejan las respuestas reales de la API Néctar LatAm.
// Base: backend/src/{routes,controllers,data,services}

/* -------------------------------------------------------------------------- */
/* Genéricos                                                                  */
/* -------------------------------------------------------------------------- */

export interface ListResponse<T> {
  total: number;
  data: T[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ApiErrorPayload {
  message?: string;
  campos_faltantes?: string[];
  paises_disponibles?: string[];
  municipios_disponibles?: string[];
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Especies nativas                                                           */
/* -------------------------------------------------------------------------- */

export interface SpeciesPlant {
  nombre: string;
  climas: string[];
}

export interface SpeciesCountry {
  pais: string;
  abejasSinAguijon: string[];
  abejasSolitarias: string[];
  plantasNativas: string[];
  catalogoPlantas: SpeciesPlant[];
}

/* -------------------------------------------------------------------------- */
/* Espacios                                                                   */
/* -------------------------------------------------------------------------- */

export interface Space {
  id: string;
  nombre_espacio: string | null;
  pais: string | null;
  departamento_municipio: string | null;
  comunidad: string | null;
  zona: string | null;
  tipo_espacio: string | null;
  cultivo_vegetacion: string | null;
  piso_climatico: string | null;
  practicas: string[];
  certificado: boolean;
  coordenadas: Coordinates | null;

  // Campos derivados por el algoritmo de recomendación
  polinizador_principal: string | null;
  polinizador_secundario: string | null;
  plantas_recomendadas: string[];
  nido_sugerido: string | null;
  grupo_polinizador: string | null;
  nota_polinizacion: string | null;

  // Gamificación
  puntos_acumulados: number;
  insignia_actual: string;
  insignia_emoji: string;
  certificacion: string;
  fecha_registro: string;
}

export interface SpaceInput {
  nombre_espacio: string;
  pais: string;
  tipo_espacio: string;
  cultivo_vegetacion: string;
  piso_climatico: string;
  departamento_municipio?: string;
  comunidad?: string;
  zona?: string;
  practicas?: string[];
  coordenadas?: Coordinates;
}

/* -------------------------------------------------------------------------- */
/* Monitoreo                                                                  */
/* -------------------------------------------------------------------------- */

export interface Monitoring {
  id: string;
  espacio_id: string;
  polinizador_avistado: string;
  cantidad: number;
  foto_url: string | null;
  coordenadas: Coordinates | null;
  notas: string | null;
  fecha_registro: string;
  puntos_otorgados: number;
}

export interface MonitoringInput {
  espacio_id: string;
  polinizador_avistado: string;
  cantidad: number;
  foto_url?: string;
  notas?: string;
  coordenadas?: Coordinates;
}

export interface MonitoringResult {
  mensaje: string;
  monitoreo: Monitoring;
  puntos_ganados: number;
  puntos_totales_espacio: number;
  insignia_actual: string;
  insignia_emoji: string;
  subio_nivel: boolean;
}

export interface MonitoringHistory {
  espacio_id: string;
  nombre_espacio: string | null;
  total: number;
  data: Monitoring[];
}

/* -------------------------------------------------------------------------- */
/* Gamificación                                                               */
/* -------------------------------------------------------------------------- */

export interface LeaderboardEntry {
  posicion: number;
  espacio_id: string;
  nombre_espacio: string | null;
  municipio: string | null;
  pais: string | null;
  puntos_acumulados: number;
  insignia_actual: string;
  insignia_emoji: string;
}

/* -------------------------------------------------------------------------- */
/* Municipio                                                                  */
/* -------------------------------------------------------------------------- */

export interface MunicipioKpis {
  espacios_registrados: number;
  practicas_implementadas: number;
  polinizadores_monitoreados: number;
  certificaciones_emitidas: number;
  indice_conectividad_porcentaje: number;
}

export interface ComunidadRanking {
  comunidad: string;
  espacios: number;
  puntos_totales: number;
}

export interface ConectividadComponentes {
  densidad_espacios: number;
  cercas_vivas: number;
  variedad_practicas: number;
}

export interface MunicipioDashboard {
  municipio: string;
  pais: string;
  kpis: MunicipioKpis;
  ranking_comunidades: ComunidadRanking[];
  conectividad_detalle: ConectividadComponentes;
}

export interface MapPoint {
  id: string;
  nombre: string | null;
  tipo: string | null;
  cultivo: string | null;
  lat: number;
  lng: number;
  polinizador_principal: string | null;
  puntos: number;
  certificado: boolean;
}

/* -------------------------------------------------------------------------- */
/* Sello "Polinizador Amigo"                                                  */
/* -------------------------------------------------------------------------- */

export interface SealFicha {
  sello_valido: boolean;
  folio_certificacion: string;
  finca_nombre: string | null;
  productor: string;
  municipio: string | null;
  pais: string | null;
  cultivo: string;
  polinizadores_protegidos: string[];
  practicas_verificadas: string[];
  metricas_impacto: {
    metros_cuadrados_habitat_activo: number;
    metros_adoptados_por_consumidores: number;
  };
  fecha_certificacion: string;
}

export interface Producer {
  espacio_id: string;
  slug: string;
  finca_nombre: string | null;
  productor: string;
  municipio: string | null;
  pais: string | null;
  cultivo: string;
  folio_certificacion: string;
  fecha_certificacion: string;
  habitat_activo_m2: number;
  metros_adoptados_por_consumidores: number;
  url_verificacion: string;
}

export interface AdoptionInput {
  espacio_id: string;
  nombre_consumidor: string;
  metros_cuadrados: number;
  email?: string;
  monto_usd?: number;
  mensaje_apoyo?: string;
}

export interface AdoptionResult {
  mensaje: string;
  comprobante: {
    folio: string;
    espacio_id: string;
    finca_nombre: string | null;
    productor: string;
    municipio: string | null;
    pais: string | null;
    nombre_consumidor: string;
    email: string | null;
    metros_cuadrados: number;
    monto_usd: number;
    mensaje_apoyo: string | null;
    fecha_adopcion: string;
  };
  impacto: {
    metros_adoptados_totales_finca: number;
    habitat_activo_m2: number;
    porcentaje_habitat_apadrinado: number;
  };
}
