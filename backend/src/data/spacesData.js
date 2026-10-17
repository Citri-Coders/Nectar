import {
  getRecommendation,
  findCountryKey,
  normalizeEnum,
} from '../services/recommendation.service.js';
import { getBadgeForPoints } from '../services/gamification.service.js';

// Persistencia en memoria (se reinicia con el servidor).
const spaces = [];
let sequence = 101;

// Normaliza la entrada del formulario y fija el nombre canónico del país.
function normalizeSpaceInput(payload = {}) {
  const paisKey = findCountryKey(payload.pais);

  return {
    nombre_espacio: payload.nombre_espacio ?? null,
    pais: paisKey ?? payload.pais ?? null,
    departamento_municipio: payload.departamento_municipio ?? null,
    comunidad: payload.comunidad ?? null,
    zona: normalizeEnum(payload.zona) || null,
    tipo_espacio: normalizeEnum(payload.tipo_espacio) || null,
    cultivo_vegetacion: normalizeEnum(payload.cultivo_vegetacion) || null,
    piso_climatico: normalizeEnum(payload.piso_climatico) || null,
    practicas: Array.isArray(payload.practicas) ? payload.practicas : [],
    certificado: Boolean(payload.certificado),
    coordenadas: payload.coordenadas ?? null,
  };
}

/**
 * Crea y persiste un espacio aplicando el algoritmo de recomendación.
 * Los espacios nuevos arrancan con los +10 puntos de bienvenida, salvo que se
 * indique otro valor mediante `options.puntosIniciales`.
 */
export function createSpace(payload = {}, options = {}) {
  const datos = normalizeSpaceInput(payload);
  const recomendacion = getRecommendation(payload);
  const puntosIniciales = Number.isFinite(options.puntosIniciales)
    ? options.puntosIniciales
    : 10;
  const insignia = getBadgeForPoints(puntosIniciales);

  const space = {
    id: `esp-${sequence++}`,
    ...datos,
    ...recomendacion,
    puntos_acumulados: puntosIniciales,
    insignia_actual: insignia.nombre,
    insignia_emoji: insignia.emoji,
    certificacion: datos.certificado ? 'Polinizador Amigo' : 'En proceso',
    fecha_registro: new Date().toISOString(),
  };

  spaces.push(space);
  return space;
}

export function listSpaces() {
  return spaces;
}

export function findSpaceById(id) {
  return spaces.find((space) => space.id === id) ?? null;
}

/**
 * Elimina un espacio por su id (solo administrador).
 * Devuelve el espacio eliminado, o null si no existía.
 */
export function deleteSpace(id) {
  const index = spaces.findIndex((space) => space.id === id);
  if (index === -1) return null;

  const [eliminado] = spaces.splice(index, 1);
  return eliminado;
}
