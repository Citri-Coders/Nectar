import { listSpaces } from '../data/spacesData.js';
import { listMonitoring } from '../data/monitoringData.js';
import { calcularConectividadDetalle } from '../services/connectivity.service.js';

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Busca los espacios cuyo municipio coincide (exacto o parcial, sin tildes).
function findMunicipioSpaces(nombreMunicipio) {
  const objetivo = normalize(nombreMunicipio);
  if (!objetivo) return [];

  return listSpaces().filter((space) => {
    const municipio = normalize(space.departamento_municipio);
    return Boolean(municipio) && (municipio === objetivo || municipio.includes(objetivo));
  });
}

function municipiosDisponibles() {
  return [...new Set(listSpaces().map((space) => space.departamento_municipio).filter(Boolean))];
}

// Agrupa los espacios por comunidad y los ordena por puntos totales.
function buildRankingComunidades(spaces) {
  const porComunidad = new Map();

  for (const space of spaces) {
    const comunidad = space.comunidad ?? 'Sin comunidad';
    const actual = porComunidad.get(comunidad) ?? { comunidad, espacios: 0, puntos_totales: 0 };
    actual.espacios += 1;
    actual.puntos_totales += space.puntos_acumulados ?? 0;
    porComunidad.set(comunidad, actual);
  }

  return [...porComunidad.values()].sort((a, b) => b.puntos_totales - a.puntos_totales);
}

// GET /api/v1/municipio/dashboard/:nombre_municipio
export function getMunicipioDashboard(req, res) {
  const { nombre_municipio: nombreMunicipio } = req.params;
  const spaces = findMunicipioSpaces(nombreMunicipio);

  if (spaces.length === 0) {
    return res.status(404).json({
      message: `No hay espacios registrados en el municipio "${nombreMunicipio}".`,
      municipios_disponibles: municipiosDisponibles(),
    });
  }

  const ids = new Set(spaces.map((space) => space.id));
  const monitoreos = listMonitoring().filter((monitoreo) => ids.has(monitoreo.espacio_id));
  const conectividad = calcularConectividadDetalle(spaces);

  const kpis = {
    espacios_registrados: spaces.length,
    practicas_implementadas: spaces.reduce(
      (total, space) => total + (space.practicas?.length ?? 0),
      0
    ),
    polinizadores_monitoreados: monitoreos.reduce(
      (total, monitoreo) => total + (Number(monitoreo.cantidad) || 0),
      0
    ),
    certificaciones_emitidas: spaces.filter((space) => space.certificado).length,
    indice_conectividad_porcentaje: conectividad.porcentaje,
  };

  return res.json({
    municipio: spaces[0].departamento_municipio,
    pais: spaces[0].pais,
    kpis,
    ranking_comunidades: buildRankingComunidades(spaces),
    conectividad_detalle: conectividad.componentes,
  });
}

// GET /api/v1/municipio/map-points/:nombre_municipio
export function getMunicipioMapPoints(req, res) {
  const { nombre_municipio: nombreMunicipio } = req.params;
  const spaces = findMunicipioSpaces(nombreMunicipio);

  if (spaces.length === 0) {
    return res.status(404).json({
      message: `No hay espacios registrados en el municipio "${nombreMunicipio}".`,
      municipios_disponibles: municipiosDisponibles(),
    });
  }

  const points = spaces
    .filter(
      (space) =>
        space.coordenadas &&
        Number.isFinite(space.coordenadas.lat) &&
        Number.isFinite(space.coordenadas.lng)
    )
    .map((space) => ({
      id: space.id,
      nombre: space.nombre_espacio,
      tipo: space.tipo_espacio,
      cultivo: space.cultivo_vegetacion,
      lat: space.coordenadas.lat,
      lng: space.coordenadas.lng,
      polinizador_principal: space.polinizador_principal,
      puntos: space.puntos_acumulados ?? 0,
      certificado: Boolean(space.certificado),
    }));

  return res.json(points);
}
