import {
  getSupportedCountries,
  findCountryKey,
  normalizeEnum,
} from '../services/recommendation.service.js';
import {
  createSpace,
  listSpaces,
  findSpaceById,
} from '../data/spacesData.js';

// Campos obligatorios del formulario de 5 pasos.
const REQUIRED_FIELDS = [
  'nombre_espacio',
  'pais',
  'tipo_espacio',
  'cultivo_vegetacion',
  'piso_climatico',
];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// POST /api/v1/spaces/segmentation
export function segmentSpace(req, res) {
  const body = req.body ?? {};

  const camposFaltantes = REQUIRED_FIELDS.filter((field) => isBlank(body[field]));
  if (camposFaltantes.length > 0) {
    return res.status(400).json({
      message: 'Faltan campos obligatorios para la segmentación.',
      campos_faltantes: camposFaltantes,
    });
  }

  if (!findCountryKey(body.pais)) {
    return res.status(400).json({
      message: `El país "${body.pais}" aún no está soportado.`,
      paises_disponibles: getSupportedCountries(),
    });
  }

  if (
    body.coordenadas &&
    (isBlank(body.coordenadas.lat) || isBlank(body.coordenadas.lng))
  ) {
    return res.status(400).json({
      message: 'El campo "coordenadas" debe incluir "lat" y "lng".',
    });
  }

  const space = createSpace(body);
  return res.status(201).json(space);
}

// GET /api/v1/spaces?pais=Nicaragua&tipo=finca_agricola
export function getAllSpaces(req, res) {
  const { pais, tipo } = req.query;
  let data = listSpaces();

  if (!isBlank(pais)) {
    const paisKey = findCountryKey(pais);
    data = paisKey ? data.filter((space) => space.pais === paisKey) : [];
  }

  if (!isBlank(tipo)) {
    // normalizeEnum unifica mayúsculas, tildes y espacios ("Finca Agrícola"
    // -> "finca_agricola") para que el filtro no falle por formato.
    const tipoBuscado = normalizeEnum(tipo);
    data = data.filter((space) => space.tipo_espacio === tipoBuscado);
  }

  return res.json({ total: data.length, data });
}

// GET /api/v1/spaces/:id
export function getSpaceById(req, res) {
  const space = findSpaceById(req.params.id);

  if (!space) {
    return res.status(404).json({
      message: `No existe un espacio registrado con el id "${req.params.id}".`,
    });
  }

  return res.json(space);
}
