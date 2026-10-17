// Lógica compartida de gamificación: puntos e insignias.
// Se usa tanto en el monitoreo (suma de puntos) como en el ranking.

// Puntos que otorga cada reporte de monitoreo.
export const PUNTOS_POR_MONITOREO = 15;

// Niveles de insignia ordenados de menor a mayor (por puntos mínimos).
export const INSIGNIAS = [
  { nombre: 'Semilla Nativa',     emoji: '🥉', minPuntos: 10 },
  { nombre: 'Guardián de Flor',   emoji: '🥈', minPuntos: 50 },
  { nombre: 'Maestro Meliponario', emoji: '🥇', minPuntos: 150 },
];

// Devuelve la insignia (nombre + emoji) correspondiente a un total de puntos.
export function getBadgeForPoints(puntos = 0) {
  const badge =
    [...INSIGNIAS].reverse().find((nivel) => puntos >= nivel.minPuntos) ?? INSIGNIAS[0];
  return { nombre: badge.nombre, emoji: badge.emoji };
}

/**
 * Suma puntos a un espacio y recalcula su insignia (mutando el objeto).
 * Devuelve el resultado de la operación para poder informar subidas de nivel.
 */
export function addPointsToSpace(space, puntos = PUNTOS_POR_MONITOREO) {
  const insigniaAnterior =
    space.insignia_actual ?? getBadgeForPoints(space.puntos_acumulados ?? 0).nombre;

  space.puntos_acumulados = (space.puntos_acumulados ?? 0) + puntos;

  const insignia = getBadgeForPoints(space.puntos_acumulados);
  space.insignia_actual = insignia.nombre;
  space.insignia_emoji = insignia.emoji;

  return {
    insignia_anterior: insigniaAnterior,
    insignia_nueva: insignia.nombre,
    insignia_emoji: insignia.emoji,
    subio_nivel: insigniaAnterior !== insignia.nombre,
  };
}
