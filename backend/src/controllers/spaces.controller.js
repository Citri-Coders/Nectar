import {
  getSupportedCountries,
  findCountryKey,
  normalizeEnum,
} from '../services/recommendation.service.js';
import {
  createSpace,
  deleteSpace as removeSpace,
  listSpaces,
  findSpaceById,
} from '../data/spacesData.js';
import { deleteMonitoringBySpace } from '../data/monitoringData.js';
import {
  CULTIVOS,
  PISOS_CLIMATICOS,
  PRACTICAS,
  TIPOS_ESPACIO,
  ZONAS,
} from '../utils/catalogos.js';
import {
  agregarError,
  hayErrores,
  isBlank,
  recortar,
  responderValidacion,
  validarCoordenadas,
  validarTexto,
  validarTextoOpcional,
} from '../utils/validacion.js';

// Campos obligatorios del formulario de 5 pasos.
const REQUIRED_FIELDS = [
  'nombre_espacio',
  'pais',
  'tipo_espacio',
  'cultivo_vegetacion',
  'piso_climatico',
];

// Máximo de prácticas agroecológicas que admite un espacio.
const MAX_PRACTICAS = 10;

// POST /api/v1/spaces/segmentation
export function segmentSpace(req, res) {
  const body = req.body ?? {};
  const camposFaltantes = REQUIRED_FIELDS.filter((field) => isBlank(body[field]));
  const camposInvalidos = {};
  let paisesDisponibles;

  if (!isBlank(body.nombre_espacio)) {
    agregarError(camposInvalidos, 'nombre_espacio', validarTexto(body.nombre_espacio, { min: 3, max: 80 }));
  }

  if (!isBlank(body.pais) && !findCountryKey(body.pais)) {
    camposInvalidos.pais = `El país "${recortar(body.pais)}" aún no está soportado.`;
    paisesDisponibles = getSupportedCountries();
  }

  // Enums obligatorios: se validan contra el catálogo tras normalizar el formato.
  const enumsObligatorios = [
    ['tipo_espacio', TIPOS_ESPACIO, 'El tipo de espacio no es válido.'],
    ['cultivo_vegetacion', CULTIVOS, 'El cultivo o vegetación no es válido.'],
    ['piso_climatico', PISOS_CLIMATICOS, 'El piso climático no es válido.'],
  ];
  for (const [campo, catalogo, mensaje] of enumsObligatorios) {
    if (isBlank(body[campo])) continue;
    if (!catalogo.includes(normalizeEnum(body[campo]))) camposInvalidos[campo] = mensaje;
  }

  // Enums y campos opcionales.
  if (!isBlank(body.zona) && !ZONAS.includes(normalizeEnum(body.zona))) {
    camposInvalidos.zona = 'La zona no es válida (urbana, periurbana o rural).';
  }
  agregarError(
    camposInvalidos,
    'departamento_municipio',
    validarTextoOpcional(body.departamento_municipio, { max: 80 })
  );
  agregarError(camposInvalidos, 'comunidad', validarTextoOpcional(body.comunidad, { max: 80 }));

  if (body.practicas !== undefined && body.practicas !== null) {
    if (!Array.isArray(body.practicas)) {
      camposInvalidos.practicas = 'Debe ser una lista de prácticas.';
    } else if (body.practicas.length > MAX_PRACTICAS) {
      camposInvalidos.practicas = `No puede tener más de ${MAX_PRACTICAS} prácticas.`;
    } else if (body.practicas.some((practica) => !PRACTICAS.includes(normalizeEnum(practica)))) {
      camposInvalidos.practicas = 'Alguna de las prácticas no es válida.';
    }
  }

  agregarError(camposInvalidos, 'coordenadas', validarCoordenadas(body.coordenadas));

  if (hayErrores(camposFaltantes, camposInvalidos)) {
    return responderValidacion(res, {
      campos_faltantes: camposFaltantes,
      campos_invalidos: camposInvalidos,
      ...(paisesDisponibles ? { paises_disponibles: paisesDisponibles } : {}),
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

// DELETE /api/v1/spaces/:id  (solo administrador)
// Elimina el espacio y, en cascada, todos sus avistamientos de monitoreo.
export function deleteSpace(req, res) {
  const { id } = req.params;
  const eliminado = removeSpace(id);

  if (!eliminado) {
    return res.status(404).json({
      message: `No existe un espacio registrado con el id "${id}".`,
    });
  }

  const monitoreosEliminados = deleteMonitoringBySpace(id);

  return res.json({
    mensaje: `Espacio "${eliminado.nombre_espacio ?? id}" eliminado con éxito.`,
    espacio_id: id,
    monitoreos_eliminados: monitoreosEliminados,
  });
}
