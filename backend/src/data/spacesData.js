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
 * `options.puntosIniciales` solo lo usan las semillas (los espacios nuevos
 * siempre arrancan con los +10 puntos de bienvenida).
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

// ---------------------------------------------------------------------------
// --- Semillas ---
// 15 espacios: 14 en Matagalpa (Nicaragua) + 1 en Pitalito, Huila (Colombia).
// Los 14 de Matagalpa se reparten en 3 comunidades: El Arenal, San Ramón y
// Yasica Sur, para alimentar el dashboard municipal y el mapa territorial.
// ---------------------------------------------------------------------------
const SEMILLAS_ESPACIOS = [
  // Nicaragua — Matagalpa (14 espacios)
  { nombre_espacio: 'Finca El Mirador',          pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'El Arenal',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva', 'nidos'],          certificado: true,  puntos_iniciales: 70, coordenadas: { lat: 12.9255, lng: -85.9178 } },
  // Colombia — Huila (1 espacio, queda fuera del dashboard de Matagalpa)
  { nombre_espacio: 'Finca La Esperanza',        pais: 'Colombia',  departamento_municipio: 'Pitalito, Huila', comunidad: null,     zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva'],                   certificado: false, puntos_iniciales: 10, coordenadas: { lat: 1.8535, lng: -76.0504 } },
  { nombre_espacio: 'Finca Los Cafetales',       pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'El Arenal',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva', 'nidos'],          certificado: true,  puntos_iniciales: 65, coordenadas: { lat: 12.9402, lng: -85.9081 } },
  { nombre_espacio: 'Patio Doña Marta',          pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'El Arenal',  zona: 'urbana', tipo_espacio: 'patio_jardin',  cultivo_vegetacion: 'hortalizas', practicas: ['franja_floral', 'nidos', 'compostaje'],          certificado: false, puntos_iniciales: 70, coordenadas: { lat: 12.9180, lng: -85.9300 } },
  { nombre_espacio: 'Escuela El Arenal',         pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'El Arenal',  zona: 'urbana', tipo_espacio: 'escuela',       cultivo_vegetacion: 'sin_cultivo', practicas: ['franja_floral', 'cerca_viva', 'nidos'],         certificado: true,  puntos_iniciales: 60, coordenadas: { lat: 12.9290, lng: -85.9120 } },
  { nombre_espacio: 'Finca El Roble',            pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'El Arenal',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'frutales',   practicas: ['cerca_viva', 'nidos', 'compostaje'],             certificado: false, puntos_iniciales: 60, coordenadas: { lat: 12.9500, lng: -85.8900 } },
  { nombre_espacio: 'Finca La Cumbre',           pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'El Arenal',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva', 'nidos'],          certificado: false, puntos_iniciales: 65, coordenadas: { lat: 12.9700, lng: -85.8800 } },

  { nombre_espacio: 'Finca San Ramón',           pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'San Ramón',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva', 'nidos'],          certificado: true,  puntos_iniciales: 75, coordenadas: { lat: 12.8700, lng: -85.9500 } },
  { nombre_espacio: 'Patio Familia López',       pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'San Ramón',  zona: 'urbana', tipo_espacio: 'patio_jardin',  cultivo_vegetacion: 'hortalizas', practicas: ['franja_floral', 'nidos', 'compostaje'],          certificado: false, puntos_iniciales: 60, coordenadas: { lat: 12.8760, lng: -85.9420 } },
  { nombre_espacio: 'Finca La Esperanza Norte',  pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'San Ramón',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cacao',      practicas: ['cerca_viva', 'nidos'],                           certificado: true,  puntos_iniciales: 70, coordenadas: { lat: 12.8600, lng: -85.9700 } },
  { nombre_espacio: 'Escuela San Ramón',         pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'San Ramón',  zona: 'urbana', tipo_espacio: 'escuela',       cultivo_vegetacion: 'sin_cultivo', practicas: ['franja_floral', 'cerca_viva'],                  certificado: false, puntos_iniciales: 50, coordenadas: { lat: 12.8820, lng: -85.9600 } },
  { nombre_espacio: 'Finca Buenavista',          pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'San Ramón',  zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva', 'nidos'],          certificado: false, puntos_iniciales: 65, coordenadas: { lat: 12.8450, lng: -85.9250 } },

  { nombre_espacio: 'Finca Yasica Sur',          pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'Yasica Sur', zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'cafe',       practicas: ['franja_floral', 'cerca_viva', 'nidos'],          certificado: true,  puntos_iniciales: 90, coordenadas: { lat: 13.0100, lng: -85.9300 } },
  { nombre_espacio: 'Finca El Bosque',           pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'Yasica Sur', zona: 'rural', tipo_espacio: 'finca_agricola', cultivo_vegetacion: 'frutales',   practicas: ['cerca_viva', 'compostaje'],                      certificado: false, puntos_iniciales: 65, coordenadas: { lat: 13.0250, lng: -85.9500 } },
  { nombre_espacio: 'Patio Comunitario Yasica',  pais: 'Nicaragua', departamento_municipio: 'Matagalpa', comunidad: 'Yasica Sur', zona: 'urbana', tipo_espacio: 'area_comunal',  cultivo_vegetacion: 'ornamentales', practicas: ['franja_floral', 'nidos'],                      certificado: false, puntos_iniciales: 65, coordenadas: { lat: 13.0050, lng: -85.9100 } },
];

for (const semilla of SEMILLAS_ESPACIOS) {
  createSpace(semilla, { puntosIniciales: semilla.puntos_iniciales });
}
