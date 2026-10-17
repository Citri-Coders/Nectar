import { listSpaces } from '../data/spacesData.js';
import { getBadgeForPoints } from '../services/gamification.service.js';

// GET /api/v1/gamification/leaderboard
export function getLeaderboard(req, res) {
  const leaderboard = [...listSpaces()]
    .sort((a, b) => (b.puntos_acumulados ?? 0) - (a.puntos_acumulados ?? 0))
    .map((space, index) => {
      const insignia = getBadgeForPoints(space.puntos_acumulados ?? 0);

      return {
        posicion: index + 1,
        espacio_id: space.id,
        nombre_espacio: space.nombre_espacio,
        municipio: space.departamento_municipio,
        pais: space.pais,
        puntos_acumulados: space.puntos_acumulados ?? 0,
        insignia_actual: space.insignia_actual ?? insignia.nombre,
        insignia_emoji: space.insignia_emoji ?? insignia.emoji,
      };
    });

  return res.json({ total: leaderboard.length, leaderboard });
}
