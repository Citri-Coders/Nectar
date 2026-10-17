import {
  createMonitoring,
  deleteMonitoring as removeMonitoring,
  listMonitoringBySpace,
} from '../data/monitoringData.js';
import { findSpaceById } from '../data/spacesData.js';
import {
  esUrlValida,
  hayErrores,
  isBlank,
  recortar,
  responderValidacion,
  validarEntero,
  validarTexto,
  validarTextoOpcional,
} from '../utils/validacion.js';

// Límites de los campos del avistamiento.
const CANTIDAD_MIN = 1;
const CANTIDAD_MAX = 1000;
const MAX_URL = 500;
const MAX_NOTAS = 500;

// POST /api/v1/monitoring
export function registerMonitoring(req, res) {
  const body = req.body ?? {};
  const camposFaltantes = ['espacio_id', 'polinizador_avistado', 'cantidad'].filter((field) =>
    isBlank(body[field])
  );
  const camposInvalidos = {};

  if (!isBlank(body.polinizador_avistado)) {
    camposInvalidos.polinizador_avistado = validarTexto(body.polinizador_avistado, {
      min: 2,
      max: 100,
    });
  }

  if (!isBlank(body.cantidad)) {
    camposInvalidos.cantidad = validarEntero(body.cantidad, { min: CANTIDAD_MIN, max: CANTIDAD_MAX });
  }

  if (!isBlank(body.foto_url)) {
    const url = recortar(body.foto_url);
    if (url.length > MAX_URL) camposInvalidos.foto_url = `No puede superar ${MAX_URL} caracteres.`;
    else if (!esUrlValida(url))
      camposInvalidos.foto_url = 'Debe ser una URL válida con formato http(s)://dominio/ruta.';
  }

  if (!isBlank(body.notas)) {
    camposInvalidos.notas = validarTextoOpcional(body.notas, { max: MAX_NOTAS });
  }

  // Se eliminan claves con valor null para dejar solo los errores reales.
  for (const campo of Object.keys(camposInvalidos)) {
    if (!camposInvalidos[campo]) delete camposInvalidos[campo];
  }

  if (hayErrores(camposFaltantes, camposInvalidos)) {
    return responderValidacion(res, { campos_faltantes: camposFaltantes, campos_invalidos: camposInvalidos });
  }

  const space = findSpaceById(body.espacio_id);
  if (!space) {
    return res.status(404).json({
      message: `No existe un espacio registrado con el id "${body.espacio_id}".`,
    });
  }

  // La ubicación del avistamiento hereda la del espacio definida en la
  // segmentación, salvo que el cliente envíe una coordenada explícita.
  const { monitoreo, gamificacion } = createMonitoring({
    ...body,
    cantidad: Number(body.cantidad),
    polinizador_avistado: recortar(body.polinizador_avistado),
    coordenadas: body.coordenadas ?? space.coordenadas ?? null,
    foto_url: isBlank(body.foto_url) ? null : recortar(body.foto_url),
    notas: isBlank(body.notas) ? null : recortar(body.notas),
  });

  return res.status(201).json({
    mensaje: 'Monitoreo registrado con éxito',
    monitoreo,
    puntos_ganados: monitoreo.puntos_otorgados,
    puntos_totales_espacio: space.puntos_acumulados,
    insignia_actual: space.insignia_actual,
    insignia_emoji: space.insignia_emoji,
    subio_nivel: gamificacion.subio_nivel,
  });
}

// GET /api/v1/monitoring/space/:espacio_id
export function getMonitoringBySpace(req, res) {
  const { espacio_id: espacioId } = req.params;

  const space = findSpaceById(espacioId);
  if (!space) {
    return res.status(404).json({
      message: `No existe un espacio registrado con el id "${espacioId}".`,
    });
  }

  const data = listMonitoringBySpace(espacioId);

  return res.json({
    espacio_id: espacioId,
    nombre_espacio: space.nombre_espacio,
    total: data.length,
    data,
  });
}

// DELETE /api/v1/monitoring/:id  (solo administrador)
// Elimina el avistamiento y descuenta sus puntos al espacio.
export function deleteMonitoring(req, res) {
  const { id } = req.params;
  const eliminado = removeMonitoring(id);

  if (!eliminado) {
    return res.status(404).json({
      message: `No existe un avistamiento de monitoreo con el id "${id}".`,
    });
  }

  const space = findSpaceById(eliminado.espacio_id);

  return res.json({
    mensaje: 'Avistamiento eliminado con éxito.',
    monitoreo_id: id,
    espacio_id: eliminado.espacio_id,
    puntos_totales_espacio: space?.puntos_acumulados ?? 0,
    insignia_actual: space?.insignia_actual ?? null,
  });
}
