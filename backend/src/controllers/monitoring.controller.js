import { createMonitoring, listMonitoringBySpace } from '../data/monitoringData.js';
import { findSpaceById } from '../data/spacesData.js';

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// Valida una URL http(s) con dominio, sin alterar el formato original.
function isValidUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

// POST /api/v1/monitoring
export function registerMonitoring(req, res) {
  const body = req.body ?? {};

  const camposFaltantes = ['espacio_id', 'polinizador_avistado', 'cantidad'].filter(
    (field) => isBlank(body[field])
  );
  if (camposFaltantes.length > 0) {
    return res.status(400).json({
      message: 'Faltan campos obligatorios para registrar el monitoreo.',
      campos_faltantes: camposFaltantes,
    });
  }

  const cantidad = Number(body.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return res.status(400).json({
      message: 'El campo "cantidad" debe ser un número mayor a 0.',
    });
  }

  if (!isBlank(body.foto_url) && !isValidUrl(body.foto_url)) {
    return res.status(400).json({
      message:
        'El campo "foto_url" debe ser una URL válida con formato http(s)://dominio/ruta.',
      campo: 'foto_url',
    });
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
    cantidad,
    coordenadas: body.coordenadas ?? space.coordenadas ?? null,
    foto_url: isBlank(body.foto_url) ? null : String(body.foto_url).trim(),
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
