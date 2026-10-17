// ============================================================================
// Repositorio de biodiversidad: consultas a la base de datos (Turso / SQLite).
// Jerarquía: PAÍS > MUNICIPIO > POLINIZADOR (aves, abejas, mamíferos).
// ============================================================================

import { queryOne, queryAll, isDatabaseAvailable } from '../db/database.js';

/** Quita tildes, espacios sobrantes y pasa a minúsculas (igual que el resto de la API). */
export function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Convierte un valor opcional de filtro en `null` (para parámetros SQL). */
function param(value) {
  const texto = normalize(value);
  return texto === '' ? null : texto;
}

/** Mapea una fila de país al formato público de la API. */
function mapPais(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    centro: { lat: row.centro_lat, lng: row.centro_lng },
    zoom: row.zoom,
    total_municipios: row.total_municipios ?? 0,
    total_polinizadores: row.total_polinizadores ?? 0,
  };
}

/** Mapea una fila de municipio al formato público de la API. */
function mapMunicipio(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    pais: row.pais,
    pais_id: row.pais_id,
    departamento: row.departamento ?? null,
    piso_climatico: row.piso_climatico ?? null,
    coordenadas:
      row.lat === null || row.lng === null ? null : { lat: row.lat, lng: row.lng },
    total_polinizadores: row.total_polinizadores ?? 0,
    polinizadores_por_tipo: {
      abeja: row.abejas ?? 0,
      ave: row.aves ?? 0,
      mamifero: row.mamiferos ?? 0,
    },
  };
}

/** Mapea una fila de polinizador al formato público de la API. */
function mapPolinizador(row) {
  return {
    id: row.id,
    nombre_cientifico: row.nombre_cientifico,
    nombre_comun: row.nombre_comun,
    tipo: row.tipo,
    grupo: row.grupo,
    descripcion: row.descripcion ?? null,
    es_nativo: row.es_nativo === undefined ? undefined : Boolean(row.es_nativo),
    abundancia: row.abundancia ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Países                                                                     */
/* -------------------------------------------------------------------------- */

// Los 11 países del proyecto, con el conteo de municipios y polinizadores.
export async function listPaises() {
  const rows = await queryAll(
    `SELECT p.id, p.nombre, p.codigo, p.centro_lat, p.centro_lng, p.zoom,
            (SELECT COUNT(*) FROM municipios m WHERE m.pais_id = p.id)      AS total_municipios,
            (SELECT COUNT(*) FROM pais_polinizador pp WHERE pp.pais_id = p.id) AS total_polinizadores
     FROM paises p
     ORDER BY p.nombre COLLATE NOCASE`
  );

  return rows.map(mapPais);
}

// Un país por nombre (sin distinguir tildes ni mayúsculas) o null.
export async function findPais(nombre) {
  const objetivo = param(nombre);
  if (!objetivo) return null;

  const row = await queryOne(
    `SELECT p.id, p.nombre, p.codigo, p.centro_lat, p.centro_lng, p.zoom,
            (SELECT COUNT(*) FROM municipios m WHERE m.pais_id = p.id)        AS total_municipios,
            (SELECT COUNT(*) FROM pais_polinizador pp WHERE pp.pais_id = p.id) AS total_polinizadores
     FROM paises p
     WHERE p.nombre_normalizado = ?`,
    [objetivo]
  );

  return row ? mapPais(row) : null;
}

// Catálogo de polinizadores nativos de un país (país > polinizador).
export async function listPolinizadoresDePais(paisId, { tipo = null, grupo = null } = {}) {
  const tipoParam = param(tipo);
  const grupoParam = param(grupo);

  const rows = await queryAll(
    `SELECT pol.id, pol.nombre_cientifico, pol.nombre_comun, pol.tipo, pol.grupo, pol.descripcion
     FROM pais_polinizador pp
     JOIN polinizadores pol ON pol.id = pp.polinizador_id
     WHERE pp.pais_id = ?
       AND (? IS NULL OR pol.tipo  = ?)
       AND (? IS NULL OR pol.grupo = ?)
     ORDER BY pol.tipo, pol.nombre_comun`,
    [paisId, tipoParam, tipoParam, grupoParam, grupoParam]
  );

  return rows.map(mapPolinizador);
}

/* -------------------------------------------------------------------------- */
/* Municipios                                                                 */
/* -------------------------------------------------------------------------- */

// Municipios de un país con el conteo de polinizadores por tipo.
export async function listMunicipiosDePais(paisId) {
  const rows = await queryAll(
    `SELECT m.id, m.nombre, m.lat, m.lng, m.departamento, m.piso_climatico,
            p.id AS pais_id, p.nombre AS pais,
            (SELECT COUNT(*) FROM municipio_polinizador x WHERE x.municipio_id = m.id) AS total_polinizadores,
            (SELECT COUNT(*) FROM municipio_polinizador x JOIN polinizadores q ON q.id = x.polinizador_id
               WHERE x.municipio_id = m.id AND q.tipo = 'abeja')    AS abejas,
            (SELECT COUNT(*) FROM municipio_polinizador x JOIN polinizadores q ON q.id = x.polinizador_id
               WHERE x.municipio_id = m.id AND q.tipo = 'ave')      AS aves,
            (SELECT COUNT(*) FROM municipio_polinizador x JOIN polinizadores q ON q.id = x.polinizador_id
               WHERE x.municipio_id = m.id AND q.tipo = 'mamifero') AS mamiferos
     FROM municipios m
     JOIN paises p ON p.id = m.pais_id
     WHERE m.pais_id = ?
     ORDER BY m.nombre COLLATE NOCASE`,
    [paisId]
  );

  return rows.map(mapMunicipio);
}

// Busca municipios por nombre; si se indica país, restringe la búsqueda.
export async function findMunicipios(nombre, paisId = null) {
  const objetivo = param(nombre);
  if (!objetivo) return [];

  const rows = await queryAll(
    `SELECT m.id, m.nombre, m.lat, m.lng, m.departamento, m.piso_climatico,
            p.id AS pais_id, p.nombre AS pais
     FROM municipios m
     JOIN paises p ON p.id = m.pais_id
     WHERE m.nombre_normalizado = ?
       AND (? IS NULL OR m.pais_id = ?)
     ORDER BY p.nombre COLLATE NOCASE`,
    [objetivo, paisId, paisId]
  );

  return rows.map(mapMunicipio);
}

/* -------------------------------------------------------------------------- */
/* Polinizadores por municipio (el filtro principal)                          */
/* -------------------------------------------------------------------------- */

// Polinizadores presentes en un municipio, opcionalmente filtrados por tipo/grupo.
export async function listPolinizadoresDeMunicipio(municipioId, { tipo = null, grupo = null } = {}) {
  const tipoParam = param(tipo);
  const grupoParam = param(grupo);

  const rows = await queryAll(
    `SELECT pol.id, pol.nombre_cientifico, pol.nombre_comun, pol.tipo, pol.grupo,
            pol.descripcion, mp.es_nativo, mp.abundancia
     FROM municipio_polinizador mp
     JOIN polinizadores pol ON pol.id = mp.polinizador_id
     WHERE mp.municipio_id = ?
       AND (? IS NULL OR pol.tipo  = ?)
       AND (? IS NULL OR pol.grupo = ?)
     ORDER BY pol.tipo, pol.nombre_comun`,
    [municipioId, tipoParam, tipoParam, grupoParam, grupoParam]
  );

  return rows.map(mapPolinizador);
}

/* -------------------------------------------------------------------------- */
/* Catálogo global de polinizadores (con filtros opcionales)                  */
/* -------------------------------------------------------------------------- */

// Lista polinizadores filtrables por tipo, grupo, país y municipio; cada uno
// incluye los países y municipios donde está registrado.
export async function listPolinizadores({ tipo = null, grupo = null, pais = null, municipio = null } = {}) {
  const tipoParam = param(tipo);
  const grupoParam = param(grupo);
  const paisParam = param(pais);
  const municipioParam = param(municipio);

  const filas = (await queryAll(
    `SELECT pol.id, pol.nombre_cientifico, pol.nombre_comun, pol.tipo, pol.grupo, pol.descripcion
     FROM polinizadores pol
     WHERE (? IS NULL OR pol.tipo  = ?)
       AND (? IS NULL OR pol.grupo = ?)
       AND EXISTS (
             SELECT 1 FROM pais_polinizador pp
             JOIN paises p ON p.id = pp.pais_id
             WHERE pp.polinizador_id = pol.id AND (? IS NULL OR p.nombre_normalizado = ?)
           )
       AND EXISTS (
             SELECT 1 FROM municipio_polinizador mp
             JOIN municipios m ON m.id = mp.municipio_id
             WHERE mp.polinizador_id = pol.id AND (? IS NULL OR m.nombre_normalizado = ?)
           )
     ORDER BY pol.tipo, pol.nombre_comun`,
    [
      tipoParam, tipoParam,
      grupoParam, grupoParam,
      paisParam, paisParam,
      municipioParam, municipioParam
    ]
  )).map(mapPolinizador);

  // Relaciones (país y municipio) agrupadas por polinizador.
  const paisesRows = await queryAll(
    `SELECT pp.polinizador_id, p.nombre AS pais
     FROM pais_polinizador pp JOIN paises p ON p.id = pp.pais_id`
  );
  const paisesPorPolinizador = new Map();
  for (const row of paisesRows) {
    if (!paisesPorPolinizador.has(row.polinizador_id)) paisesPorPolinizador.set(row.polinizador_id, []);
    paisesPorPolinizador.get(row.polinizador_id).push(row.pais);
  }

  const municipiosRows = await queryAll(
    `SELECT mp.polinizador_id, m.nombre AS municipio, p.nombre AS pais
     FROM municipio_polinizador mp
     JOIN municipios m ON m.id = mp.municipio_id
     JOIN paises p ON p.id = m.pais_id`
  );
  const municipiosPorPolinizador = new Map();
  for (const row of municipiosRows) {
    if (!municipiosPorPolinizador.has(row.polinizador_id)) municipiosPorPolinizador.set(row.polinizador_id, []);
    municipiosPorPolinizador.get(row.polinizador_id).push({ municipio: row.municipio, pais: row.pais });
  }

  return filas.map((pol) => ({
    ...pol,
    paises: paisesPorPolinizador.get(pol.id) ?? [],
    municipios: municipiosPorPolinizador.get(pol.id) ?? [],
  }));
}

/* -------------------------------------------------------------------------- */
/* Catálogo jerárquico completo: PAÍS > MUNICIPIO > POLINIZADOR               */
/* -------------------------------------------------------------------------- */

export async function getCatalogoJerarquico() {
  const rows = await queryAll(
    `SELECT pais_id, pais, municipio_id, municipio, departamento, piso_climatico,
            polinizador_id, nombre_cientifico, nombre_comun, tipo, grupo,
            es_nativo, abundancia
     FROM vw_catalogo_pais_municipio
     ORDER BY pais COLLATE NOCASE, municipio COLLATE NOCASE, tipo, nombre_comun`
  );

  const paises = new Map();

  for (const row of rows) {
    let pais = paises.get(row.pais_id);
    if (!pais) {
      pais = { id: row.pais_id, nombre: row.pais, municipios: new Map() };
      paises.set(row.pais_id, pais);
    }

    let municipio = pais.municipios.get(row.municipio_id);
    if (!municipio) {
      municipio = {
        id: row.municipio_id,
        nombre: row.municipio,
        departamento: row.departamento ?? null,
        piso_climatico: row.piso_climatico ?? null,
        polinizadores: [],
      };
      pais.municipios.set(row.municipio_id, municipio);
    }

    municipio.polinizadores.push({
      id: row.polinizador_id,
      nombre_cientifico: row.nombre_cientifico,
      nombre_comun: row.nombre_comun,
      tipo: row.tipo,
      grupo: row.grupo,
      es_nativo: Boolean(row.es_nativo),
      abundancia: row.abundancia,
    });
  }

  return [...paises.values()].map((pais) => ({
    id: pais.id,
    nombre: pais.nombre,
    municipios: [...pais.municipios.values()].map((municipio) => ({
      ...municipio,
      total_polinizadores: municipio.polinizadores.length,
    })),
  }));
}

/** Comprueba que la base de datos esté operativa (para respuestas 503). */
export async function databaseReady() {
  return isDatabaseAvailable();
}
