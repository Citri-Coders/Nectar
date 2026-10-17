import { findSpaceById } from './spacesData.js';
import {
  addPointsToSpace,
  getBadgeForPoints,
  PUNTOS_POR_MONITOREO,
} from '../services/gamification.service.js';

// Persistencia en memoria de los avistamientos (se reinicia con el servidor).
const monitoreos = [];
let sequence = 1;

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

/**
 * Elimina un avistamiento (solo administrador) y devuelve los puntos otorgados
 * al espacio, para que el ranking refleje la baja.
 * Devuelve el monitoreo eliminado, o null si no existía.
 */
export function deleteMonitoring(id) {
  const index = monitoreos.findIndex((monitoreo) => monitoreo.id === id);
  if (index === -1) return null;

  const [eliminado] = monitoreos.splice(index, 1);

  const space = findSpaceById(eliminado.espacio_id);
  if (space) {
    space.puntos_acumulados = Math.max(
      0,
      (space.puntos_acumulados ?? 0) - (eliminado.puntos_otorgados ?? 0)
    );
    const insignia = getBadgeForPoints(space.puntos_acumulados);
    space.insignia_actual = insignia.nombre;
    space.insignia_emoji = insignia.emoji;
  }

  return eliminado;
}

/**
 * Elimina todos los avistamientos de un espacio. Se usa al borrar un espacio
 * para no dejar registros huérfanos. Devuelve cuántos se eliminaron.
 */
export function deleteMonitoringBySpace(espacioId) {
  let eliminados = 0;

  for (let i = monitoreos.length - 1; i >= 0; i -= 1) {
    if (monitoreos[i].espacio_id === espacioId) {
      monitoreos.splice(i, 1);
      eliminados += 1;
    }
  }

  return eliminados;
}
