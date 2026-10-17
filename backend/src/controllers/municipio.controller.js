import { listSpaces } from '../data/spacesData.js';
import { listMonitoring } from '../data/monitoringData.js';
import { calcularConectividadDetalle } from '../services/connectivity.service.js';
import {
  findCountryKey,
  getSupportedCountries,
} from '../services/recommendation.service.js';
import { responderValidacion, validarTexto } from '../utils/validacion.js';

// Valida el nombre de municipio recibido por la URL.
function validarMunicipio(res, nombreMunicipio) {
  const mensaje = validarTexto(nombreMunicipio, { min: 2, max: 80 });
  if (!mensaje) return null;
  return responderValidacion(res, { campos_invalidos: { nombre_municipio: mensaje } });
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// Resuelve el país de la consulta: solo se aceptan los países soportados.
function resolvePaisFiltro(value) {
  if (isBlank(value)) return { paisKey: null, error: null };

  const paisKey = findCountryKey(value);
  if (!paisKey) {
    return {
      paisKey: null,
      error: `El país "${value}" no está soportado para consultar municipios.`,
    };
  }

  return { paisKey, error: null };
}

// Busca los espacios cuyo municipio coincide (exacto o parcial, sin tildes).
// Si se indica un país soportado, la búsqueda se restringe a ese país.
function findMunicipioSpaces(nombreMunicipio, paisKey = null) {
  const objetivo = normalize(nombreMunicipio);
  if (!objetivo) return [];

  return listSpaces().filter((space) => {
    if (paisKey && space.pais !== paisKey) return false;
    const municipio = normalize(space.departamento_municipio);
    return Boolean(municipio) && (municipio === objetivo || municipio.includes(objetivo));
  });
}

function municipiosDisponibles(paisKey = null) {
  return [
    ...new Set(
      listSpaces()
        .filter((space) => !paisKey || space.pais === paisKey)
        .map((space) => space.departamento_municipio)
        .filter(Boolean)
    ),
  ];
}

// GET /api/v1/municipio/catalogo
// Devuelve los municipios con datos agrupados por país, limitado a los países
// soportados por la biblioteca de especies nativas.
export function getMunicipioCatalogo(req, res) {
  const espacios = listSpaces();

  const data = getSupportedCountries().map((pais) => {
    const delPais = espacios.filter((space) => space.pais === pais);
    const nombres = [...new Set(delPais.map((space) => space.departamento_municipio).filter(Boolean))];

    const municipios = nombres
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((nombre) => ({
        nombre,
        espacios: delPais.filter((space) => space.departamento_municipio === nombre).length,
      }));

    return { pais, municipios };
  });

  return res.json({ total: data.length, data });
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

// GET /api/v1/municipio/dashboard/:nombre_municipio?pais=Nicaragua
export function getMunicipioDashboard(req, res) {
  const { nombre_municipio: nombreMunicipio } = req.params;
  const { paisKey, error } = resolvePaisFiltro(req.query.pais);

  if (error) {
    return res.status(400).json({ message: error, paises_disponibles: getSupportedCountries() });
  }

  const invalido = validarMunicipio(res, nombreMunicipio);
  if (invalido) return invalido;

  const spaces = findMunicipioSpaces(nombreMunicipio, paisKey);

  if (spaces.length === 0) {
    return res.status(404).json({
      message: paisKey
        ? `No hay espacios registrados en el municipio "${nombreMunicipio}" de ${paisKey}.`
        : `No hay espacios registrados en el municipio "${nombreMunicipio}".`,
      pais: paisKey,
      paises_disponibles: getSupportedCountries(),
      municipios_disponibles: municipiosDisponibles(paisKey),
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

// GET /api/v1/municipio/map-points/:nombre_municipio?pais=Nicaragua
export function getMunicipioMapPoints(req, res) {
  const { nombre_municipio: nombreMunicipio } = req.params;
  const { paisKey, error } = resolvePaisFiltro(req.query.pais);

  if (error) {
    return res.status(400).json({ message: error, paises_disponibles: getSupportedCountries() });
  }

  const invalido = validarMunicipio(res, nombreMunicipio);
  if (invalido) return invalido;

  const spaces = findMunicipioSpaces(nombreMunicipio, paisKey);

  if (spaces.length === 0) {
    return res.status(404).json({
      message: paisKey
        ? `No hay espacios registrados en el municipio "${nombreMunicipio}" de ${paisKey}.`
        : `No hay espacios registrados en el municipio "${nombreMunicipio}".`,
      pais: paisKey,
      paises_disponibles: getSupportedCountries(),
      municipios_disponibles: municipiosDisponibles(paisKey),
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
