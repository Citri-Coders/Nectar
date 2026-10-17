// ============================================================================
// Controlador de biodiversidad: expone la jerarquía
// PAÍS > MUNICIPIO > POLINIZADOR almacenada en SQLite.
// ============================================================================

import {
  listPaises,
  findPais,
  listMunicipiosDePais,
  findMunicipios,
  listPolinizadoresDeMunicipio,
  listPolinizadores,
  listPolinizadoresDePais,
  getCatalogoJerarquico,
  databaseReady,
} from '../repositories/biodiversidad.repository.js';

// Tipos de polinizador aceptados por los filtros.
const TIPOS = ['abeja', 'ave', 'mamifero'];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// Valida el parámetro ?tipo= y devuelve un error legible si no es válido.
function validarTipo(value) {
  if (isBlank(value)) return { tipo: null, error: null };
  const tipo = String(value).trim().toLowerCase();
  if (!TIPOS.includes(tipo)) {
    return { tipo: null, error: `El tipo "${value}" no es válido. Usa: ${TIPOS.join(', ')}.` };
  }
  return { tipo, error: null };
}

// Envuelve una consulta a la base de datos para responder 503 si no está
// disponible y delegar el resto de errores al manejador central de Express.
function conBaseDeDatos(res, next, run) {
  if (!databaseReady()) {
    res.status(503).json({
      message: 'La base de datos de biodiversidad no está disponible.',
    });
    return;
  }

  try {
    run();
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/biodiversidad/paises
// Los países del proyecto con su número de municipios y polinizadores.
export function getPaises(req, res, next) {
  conBaseDeDatos(res, next, () => {
    const data = listPaises();
    return res.json({ total: data.length, data });
  });
}

// GET /api/v1/biodiversidad/paises/:pais
// Detalle de un país: municipios + catálogo de polinizadores nativos.
export function getPaisDetalle(req, res, next) {
  conBaseDeDatos(res, next, () => {
    const { tipo, error } = validarTipo(req.query.tipo);
    if (error) return res.status(400).json({ message: error });

    const pais = findPais(req.params.pais);
    if (!pais) {
      return res.status(404).json({
        message: `El país "${req.params.pais}" no está registrado en la base de datos.`,
        paises_disponibles: listPaises().map((item) => item.nombre),
      });
    }

    return res.json({
      ...pais,
      municipios: listMunicipiosDePais(pais.id),
      polinizadores: listPolinizadoresDePais(pais.id, { tipo }),
    });
  });
}

// GET /api/v1/biodiversidad/paises/:pais/municipios
// Municipios del país con el conteo de polinizadores por tipo.
export function getMunicipiosDePais(req, res, next) {
  conBaseDeDatos(res, next, () => {
    const pais = findPais(req.params.pais);
    if (!pais) {
      return res.status(404).json({
        message: `El país "${req.params.pais}" no está registrado en la base de datos.`,
        paises_disponibles: listPaises().map((item) => item.nombre),
      });
    }

    const data = listMunicipiosDePais(pais.id);
    return res.json({ pais: pais.nombre, total: data.length, data });
  });
}

// GET /api/v1/biodiversidad/municipios/:municipio/polinizadores?pais=&tipo=
// Filtra por municipio y muestra sus polinizadores (aves, abejas, mamíferos).
export function getPolinizadoresDeMunicipio(req, res, next) {
  conBaseDeDatos(res, next, () => {
    const { tipo, error } = validarTipo(req.query.tipo);
    if (error) return res.status(400).json({ message: error });

    const pais = isBlank(req.query.pais) ? null : findPais(req.query.pais);
    if (!isBlank(req.query.pais) && !pais) {
      return res.status(404).json({
        message: `El país "${req.query.pais}" no está registrado en la base de datos.`,
        paises_disponibles: listPaises().map((item) => item.nombre),
      });
    }

    const municipios = findMunicipios(req.params.municipio, pais?.id ?? null);
    if (municipios.length === 0) {
      return res.status(404).json({
        message: pais
          ? `No hay polinizadores registrados en el municipio "${req.params.municipio}" de ${pais.nombre}.`
          : `No hay polinizadores registrados en el municipio "${req.params.municipio}".`,
        paises_disponibles: listPaises().map((item) => item.nombre),
      });
    }

    const municipio = municipios[0];
    const polinizadores = listPolinizadoresDeMunicipio(municipio.id, { tipo });
    const porTipo = { abeja: 0, ave: 0, mamifero: 0 };
    for (const pol of polinizadores) porTipo[pol.tipo] += 1;

    return res.json({
      pais: municipio.pais,
      municipio: municipio.nombre,
      departamento: municipio.departamento,
      piso_climatico: municipio.piso_climatico,
      coordenadas: municipio.coordenadas,
      total: polinizadores.length,
      polinizadores_por_tipo: porTipo,
      data: polinizadores,
    });
  });
}

// GET /api/v1/biodiversidad/polinizadores?tipo=&grupo=&pais=&municipio=
// Catálogo global de polinizadores con los países/municipios donde aparece.
export function getPolinizadores(req, res, next) {
  conBaseDeDatos(res, next, () => {
    const { tipo, error } = validarTipo(req.query.tipo);
    if (error) return res.status(400).json({ message: error });

    const data = listPolinizadores({
      tipo,
      grupo: req.query.grupo,
      pais: req.query.pais,
      municipio: req.query.municipio,
    });

    return res.json({ total: data.length, data });
  });
}

// GET /api/v1/biodiversidad/catalogo
// Jerarquía completa: país > municipio > polinizador.
export function getCatalogo(req, res, next) {
  conBaseDeDatos(res, next, () => {
    const data = getCatalogoJerarquico();
    return res.json({ total: data.length, data });
  });
}
