import { findSpaceById } from '../data/spacesData.js';
import {
  findCertification,
  listCertifications,
  createAdoption,
  getAdoptedM2,
} from '../data/sealData.js';

const PRECIO_SUGERIDO_POR_M2 = 0.5; // USD por metro cuadrado (si no lo envían)

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// Arma la ficha pública de trazabilidad a partir de la certificación y el espacio.
function buildFicha(cert, space) {
  const metrosAdoptados = getAdoptedM2(cert.espacio_id);

  return {
    sello_valido: cert.activo,
    folio_certificacion: cert.folio_certificacion,
    finca_nombre: space?.nombre_espacio ?? null,
    productor: cert.productor,
    municipio: space?.departamento_municipio ?? null,
    pais: space?.pais ?? null,
    cultivo: cert.cultivo,
    polinizadores_protegidos: cert.polinizadores_protegidos,
    practicas_verificadas: cert.practicas_verificadas,
    metricas_impacto: {
      metros_cuadrados_habitat_activo: cert.metros_cuadrados_habitat_activo,
      metros_adoptados_por_consumidores: metrosAdoptados,
    },
    fecha_certificacion: cert.fecha_certificacion,
  };
}

// GET /api/v1/seal/verify/:id_o_slug
export function verifySeal(req, res) {
  const { id_o_slug: idOSlug } = req.params;
  const cert = findCertification(idOSlug);

  if (!cert) {
    return res.status(404).json({
      sello_valido: false,
      message: `No existe un Sello "Polinizador Amigo" para "${idOSlug}".`,
    });
  }

  const space = findSpaceById(cert.espacio_id);
  return res.json(buildFicha(cert, space));
}

// POST /api/v1/seal/adopt
export function adoptHabitat(req, res) {
  const body = req.body ?? {};

  const camposFaltantes = ['espacio_id', 'nombre_consumidor', 'metros_cuadrados'].filter(
    (field) => isBlank(body[field])
  );
  if (camposFaltantes.length > 0) {
    return res.status(400).json({
      message: 'Faltan campos obligatorios para registrar la adopción.',
      campos_faltantes: camposFaltantes,
    });
  }

  const metros = Number(body.metros_cuadrados);
  if (!Number.isFinite(metros) || metros <= 0) {
    return res.status(400).json({
      message: 'El campo "metros_cuadrados" debe ser un número mayor a 0.',
    });
  }

  const space = findSpaceById(body.espacio_id);
  if (!space) {
    return res.status(404).json({
      message: `No existe un espacio registrado con el id "${body.espacio_id}".`,
    });
  }

  const cert = listCertifications().find(
    (certificacion) => certificacion.espacio_id === space.id && certificacion.activo
  );
  if (!cert) {
    return res.status(400).json({
      message: `La finca "${space.nombre_espacio}" no cuenta con un Sello "Polinizador Amigo" activo.`,
    });
  }

  const monto = Number.isFinite(Number(body.monto_usd))
    ? Number(body.monto_usd)
    : Number((metros * PRECIO_SUGERIDO_POR_M2).toFixed(2));

  const adopcion = createAdoption({
    ...body,
    espacio_id: space.id,
    metros_cuadrados: metros,
    monto_usd: monto,
  });

  const totalAdoptado = getAdoptedM2(space.id);
  const habitat = cert.metros_cuadrados_habitat_activo;

  return res.status(201).json({
    mensaje: 'Adopción registrada con éxito. ¡Gracias por apoyar a los polinizadores!',
    comprobante: {
      folio: adopcion.id,
      espacio_id: space.id,
      finca_nombre: space.nombre_espacio,
      productor: cert.productor,
      municipio: space.departamento_municipio,
      pais: space.pais,
      nombre_consumidor: adopcion.nombre_consumidor,
      email: adopcion.email,
      metros_cuadrados: adopcion.metros_cuadrados,
      monto_usd: adopcion.monto_usd,
      mensaje_apoyo: adopcion.mensaje_apoyo,
      fecha_adopcion: adopcion.fecha_adopcion,
    },
    impacto: {
      metros_adoptados_totales_finca: totalAdoptado,
      habitat_activo_m2: habitat,
      porcentaje_habitat_apadrinado: habitat
        ? Math.round((totalAdoptado / habitat) * 1000) / 10
        : 0,
    },
  });
}

// GET /api/v1/seal/producers
export function getProducers(req, res) {
  const data = listCertifications()
    .filter((cert) => cert.activo)
    .map((cert) => {
      const space = findSpaceById(cert.espacio_id);

      return {
        espacio_id: cert.espacio_id,
        slug: cert.slug,
        finca_nombre: space?.nombre_espacio ?? null,
        productor: cert.productor,
        municipio: space?.departamento_municipio ?? null,
        pais: space?.pais ?? null,
        cultivo: cert.cultivo,
        folio_certificacion: cert.folio_certificacion,
        fecha_certificacion: cert.fecha_certificacion,
        habitat_activo_m2: cert.metros_cuadrados_habitat_activo,
        metros_adoptados_por_consumidores: getAdoptedM2(cert.espacio_id),
        url_verificacion: `/api/v1/seal/verify/${cert.slug}`,
      };
    });

  return res.json({ total: data.length, data });
}
