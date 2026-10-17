// ============================================================================
// Controlador de biodiversidad: expone la jerarquía
// PAÍS > MUNICIPIO > POLINIZADOR almacenada en la base de datos (Turso / SQLite).
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
async function conBaseDeDatos(res, next, run) {
  const ready = await databaseReady();
  if (!ready) {
    res.status(503).json({
      message: 'La base de datos de biodiversidad no está disponible.',
    });
    return;
  }

  try {
    await run();
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/biodiversidad/paises
// Los países del proyecto con su número de municipios y polinizadores.
export async function getPaises(req, res, next) {
  await conBaseDeDatos(res, next, async () => {
    const data = await listPaises();
    return res.json({ total: data.length, data });
  });
}

// GET /api/v1/biodiversidad/paises/:pais
// Detalle de un país: municipios + catálogo de polinizadores nativos.
export async function getPaisDetalle(req, res, next) {
  await conBaseDeDatos(res, next, async () => {
    const { tipo, error } = validarTipo(req.query.tipo);
    if (error) return res.status(400).json({ message: error });

    const pais = await findPais(req.params.pais);
    if (!pais) {
      const paises = await listPaises();
      return res.status(404).json({
        message: `El país "${req.params.pais}" no está registrado en la base de datos.`,
        paises_disponibles: paises.map((item) => item.nombre),
      });
    }

    const [municipios, polinizadores] = await Promise.all([
      listMunicipiosDePais(pais.id),
      listPolinizadoresDePais(pais.id, { tipo }),
    ]);

    return res.json({
      ...pais,
      municipios,
      polinizadores,
    });
  });
}

// GET /api/v1/biodiversidad/paises/:pais/municipios
// Municipios del país con el conteo de polinizadores por tipo.
export async function getMunicipiosDePais(req, res, next) {
  await conBaseDeDatos(res, next, async () => {
    const pais = await findPais(req.params.pais);
    if (!pais) {
      const paises = await listPaises();
      return res.status(404).json({
        message: `El país "${req.params.pais}" no está registrado en la base de datos.`,
        paises_disponibles: paises.map((item) => item.nombre),
      });
    }

    const data = await listMunicipiosDePais(pais.id);
    return res.json({ pais: pais.nombre, total: data.length, data });
  });
}

// GET /api/v1/biodiversidad/municipios/:municipio/polinizadores?pais=&tipo=
// Filtra por municipio y muestra sus polinizadores (aves, abejas, mamíferos).
export async function getPolinizadoresDeMunicipio(req, res, next) {
  await conBaseDeDatos(res, next, async () => {
    const { tipo, error } = validarTipo(req.query.tipo);
    if (error) return res.status(400).json({ message: error });

    const pais = isBlank(req.query.pais) ? null : await findPais(req.query.pais);
    if (!isBlank(req.query.pais) && !pais) {
      const paises = await listPaises();
      return res.status(404).json({
        message: `El país "${req.query.pais}" no está registrado en la base de datos.`,
        paises_disponibles: paises.map((item) => item.nombre),
      });
    }

    const municipios = await findMunicipios(req.params.municipio, pais?.id ?? null);
    if (municipios.length === 0) {
      const paises = await listPaises();
      return res.status(404).json({
        message: pais
          ? `No hay polinizadores registrados en el municipio "${req.params.municipio}" de ${pais.nombre}.`
          : `No hay polinizadores registrados en el municipio "${req.params.municipio}".`,
        paises_disponibles: paises.map((item) => item.nombre),
      });
    }

    const municipio = municipios[0];
    const polinizadores = await listPolinizadoresDeMunicipio(municipio.id, { tipo });
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
export async function getPolinizadores(req, res, next) {
  await conBaseDeDatos(res, next, async () => {
    const { tipo, error } = validarTipo(req.query.tipo);
    if (error) return res.status(400).json({ message: error });

    const data = await listPolinizadores({
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
export async function getCatalogo(req, res, next) {
  await conBaseDeDatos(res, next, async () => {
    const data = await getCatalogoJerarquico();
    return res.json({ total: data.length, data });
  });
}
