import { findSpaceById } from '../data/spacesData.js';
import {
  findCertification,
  listCertifications,
  createAdoption,
  getAdoptedM2,
} from '../data/sealData.js';
import {
  esEmailValido,
  hayErrores,
  isBlank,
  recortar,
  responderValidacion,
  validarNumero,
  validarTexto,
  validarTextoOpcional,
} from '../utils/validacion.js';

const PRECIO_SUGERIDO_POR_M2 = 0.5; // USD por metro cuadrado (si no lo envían)
const MAX_METROS = 100000;
const MAX_MENSAJE = 300;
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

  const camposFaltantes = ['espacio_id', 'nombre_consumidor', 'metros_cuadrados'].filter((field) =>
    isBlank(body[field])
  );
  const camposInvalidos = {};

  if (!isBlank(body.nombre_consumidor)) {
    camposInvalidos.nombre_consumidor = validarTexto(body.nombre_consumidor, { min: 2, max: 100 });
  }

  if (!isBlank(body.metros_cuadrados)) {
    camposInvalidos.metros_cuadrados = validarNumero(body.metros_cuadrados, {
      min: 1,
      max: MAX_METROS,
    });
  }

  // El monto a pagar nunca puede ser negativo.
  if (!isBlank(body.monto_usd)) {
    camposInvalidos.monto_usd = validarNumero(body.monto_usd, { min: 0 });
  }

  // El correo es opcional, pero si viene debe tener formato válido.
  if (!isBlank(body.email) && !esEmailValido(body.email)) {
    camposInvalidos.email = 'Escribe un correo electrónico válido.';
  }

  if (!isBlank(body.mensaje_apoyo)) {
    camposInvalidos.mensaje_apoyo = validarTextoOpcional(body.mensaje_apoyo, { max: MAX_MENSAJE });
  }

  for (const campo of Object.keys(camposInvalidos)) {
    if (!camposInvalidos[campo]) delete camposInvalidos[campo];
  }

  if (hayErrores(camposFaltantes, camposInvalidos)) {
    return responderValidacion(res, { campos_faltantes: camposFaltantes, campos_invalidos: camposInvalidos });
  }

  const metros = Number(body.metros_cuadrados);

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

  const monto = isBlank(body.monto_usd)
    ? Number((metros * PRECIO_SUGERIDO_POR_M2).toFixed(2))
    : Number(body.monto_usd);

  const adopcion = createAdoption({
    ...body,
    espacio_id: space.id,
    nombre_consumidor: recortar(body.nombre_consumidor),
    email: isBlank(body.email) ? null : recortar(body.email),
    metros_cuadrados: metros,
    monto_usd: monto,
    mensaje_apoyo: isBlank(body.mensaje_apoyo) ? null : recortar(body.mensaje_apoyo),
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
