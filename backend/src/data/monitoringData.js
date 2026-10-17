import { findSpaceById } from './spacesData.js';
import {
  addPointsToSpace,
  PUNTOS_POR_MONITOREO,
} from '../services/gamification.service.js';

// Persistencia en memoria de los avistamientos (se reinicia con el servidor).
const monitoreos = [];
let sequence = 1;

function fechaHaceDias(dias) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Registra un avistamiento y suma puntos al espacio correspondiente.
 * Devuelve null si el espacio no existe (el controlador responde 404).
 */
export function createMonitoring(payload = {}) {
  const space = findSpaceById(payload.espacio_id);
  if (!space) return null;

  const monitoreo = {
    id: `mon-${sequence++}`,
    espacio_id: space.id,
    polinizador_avistado: payload.polinizador_avistado ?? null,
    cantidad: Number(payload.cantidad),
    foto_url: payload.foto_url ?? null,
    coordenadas: payload.coordenadas ?? null,
    notas: payload.notas ?? null,
    fecha_registro: payload.fecha_registro ?? new Date().toISOString(),
    puntos_otorgados: PUNTOS_POR_MONITOREO,
  };

  monitoreos.push(monitoreo);

  const gamificacion = addPointsToSpace(space, PUNTOS_POR_MONITOREO);

  return { monitoreo, space, gamificacion };
}

export function listMonitoring() {
  return monitoreos;
}

export function listMonitoringBySpace(espacioId) {
  return monitoreos.filter((monitoreo) => monitoreo.espacio_id === espacioId);
}

// ---------------------------------------------------------------------------
// --- Monitoreos semilla (histórico de campo) ---
// 20 avistamientos en Matagalpa (suman 245 polinizadores monitoreados) + 1 en
// Colombia. Cada avistamiento otorga +15 pts, lo que —junto con los puntos
// iniciales de cada finca— produce el ranking por comunidad del municipio.
// ---------------------------------------------------------------------------
const SEMILLAS_MONITOREO = [
  // El Arenal (10 avistamientos / 117 polinizadores)
  { espacio_id: 'esp-101', polinizadores: ['Melipona beecheii', 'Xylocopa', 'Trigona fulviventris', 'Centris'], cantidades: [12, 8, 15, 10], dias: 30, notas: 'Seguimiento mensual del cafetal' },
  { espacio_id: 'esp-103', polinizadores: ['Melipona beecheii', 'Xylocopa', 'Centris'],                        cantidades: [10, 9, 11],     dias: 25, notas: 'Transecto en la franja floral' },
  { espacio_id: 'esp-105', polinizadores: ['Xylocopa', 'Centris'],                                            cantidades: [20, 15],        dias: 20, notas: 'Jornada escolar de monitoreo' },
  { espacio_id: 'esp-106', polinizadores: ['Melipona beecheii'],                                              cantidades: [7],             dias: 15, notas: 'Visita a la cerca viva' },

  // San Ramón (6 avistamientos / 79 polinizadores)
  { espacio_id: 'esp-108', polinizadores: ['Melipona beecheii', 'Trigona fulviventris', 'Xylocopa'],          cantidades: [14, 12, 10],    dias: 28, notas: 'Monitoreo de nidos instalados' },
  { espacio_id: 'esp-110', polinizadores: ['Melipona beecheii', 'Centris'],                                   cantidades: [18, 16],        dias: 22, notas: 'Conteo en floración de cacao' },
  { espacio_id: 'esp-112', polinizadores: ['Xylocopa'],                                                       cantidades: [9],             dias: 16, notas: 'Avistamiento puntual en frutales' },

  // Yasica Sur (4 avistamientos / 49 polinizadores)
  { espacio_id: 'esp-113', polinizadores: ['Melipona beecheii', 'Trigona fulviventris'],                      cantidades: [16, 14],        dias: 24, notas: 'Transecto en cafetal de altura' },
  { espacio_id: 'esp-114', polinizadores: ['Xylocopa'],                                                       cantidades: [11],            dias: 18, notas: 'Cerca viva de madero negro' },
  { espacio_id: 'esp-115', polinizadores: ['Centris'],                                                        cantidades: [8],             dias: 10, notas: 'Monitoreo comunitario del patio' },

  // Colombia — Huila (1 avistamiento / 5 polinizadores)
  { espacio_id: 'esp-102', polinizadores: ['Melipona compressipes'],                                          cantidades: [5],             dias: 3,  notas: 'Primeros avistamientos en el lote de café del Huila' },
];

for (const semilla of SEMILLAS_MONITOREO) {
  semilla.cantidades.forEach((cantidad, index) => {
    createMonitoring({
      espacio_id: semilla.espacio_id,
      polinizador_avistado: semilla.polinizadores[index % semilla.polinizadores.length],
      cantidad,
      foto_url:
        semilla.espacio_id === 'esp-101' && index === 0
          ? 'https://images.unsplash.com/photo-1587049352846-4a222e784d38'
          : null,
      notas: semilla.notas,
      fecha_registro: fechaHaceDias(semilla.dias - index * 2),
    });
  });
}
