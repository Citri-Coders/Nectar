// ============================================================================
// Utilidades de validación compartidas por los controladores.
// ----------------------------------------------------------------------------
// Formato uniforme de error (HTTP 400):
//     {
//       "message": "Revisa los datos enviados.",
//       "campos_faltantes": ["cantidad"],
//       "campos_invalidos": { "cantidad": "Debe ser un número entero entre 1 y 1000." }
//     }
// ============================================================================

export const MENSAJE_VALIDACION = 'Revisa los datos enviados.';

/** ¿El valor es nulo, indefinido o una cadena vacía? */
export function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Recorta los espacios externos de un valor y lo devuelve como texto. */
export function recortar(value) {
  return String(value ?? '').trim();
}

/** Valida un texto. Devuelve el mensaje de error o null si es válido. */
export function validarTexto(value, { min = 1, max = 120 } = {}) {
  const texto = recortar(value);
  if (texto.length < min) return `Debe tener al menos ${min} caracteres.`;
  if (texto.length > max) return `No puede superar ${max} caracteres.`;
  return null;
}

/** Valida un texto opcional (vacío = válido). */
export function validarTextoOpcional(value, { max = 120 } = {}) {
  if (isBlank(value)) return null;
  return validarTexto(value, { min: 1, max });
}

/** Valida un número entero dentro de un rango. */
export function validarEntero(value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numero = Number(value);
  if (!Number.isFinite(numero) || !Number.isInteger(numero)) return 'Debe ser un número entero.';
  if (numero < min || numero > max) return `Debe estar entre ${min} y ${max}.`;
  return null;
}

/** Valida un número decimal dentro de un rango. */
export function validarNumero(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numero = Number(value);
  if (!Number.isFinite(numero)) return 'Debe ser un número.';
  if (numero < min || numero > max) return `Debe estar entre ${min} y ${max}.`;
  return null;
}

/** ¿Es un valor perteneciente al catálogo indicado? */
export function esDelCatalogo(value, catalogo) {
  return catalogo.includes(recortar(value));
}

/** Valida el par de coordenadas { lat, lng }. */
export function validarCoordenadas(coordenadas) {
  if (coordenadas === undefined || coordenadas === null) return null; // Opcional.
  if (typeof coordenadas !== 'object') return 'Debe ser un objeto con "lat" y "lng".';
  if (isBlank(coordenadas.lat) || isBlank(coordenadas.lng)) return 'Debe incluir "lat" y "lng".';

  const lat = Number(coordenadas.lat);
  const lng = Number(coordenadas.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return '"lat" debe ser un número entre -90 y 90.';
  if (!Number.isFinite(lng) || lng < -180 || lng > 180)
    return '"lng" debe ser un número entre -180 y 180.';
  return null;
}

/** Valida una URL http(s) con dominio. */
export function esUrlValida(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Valida un correo electrónico con formato básico. */
export function esEmailValido(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recortar(value));
}

/** Añade al objeto de errores solo cuando hay mensaje. */
export function agregarError(errores, campo, mensaje) {
  if (mensaje) errores[campo] = mensaje;
  return errores;
}

/** Responde un 400 con el formato uniforme de validación. */
export function responderValidacion(
  res,
  { message = MENSAJE_VALIDACION, campos_faltantes = [], campos_invalidos = {}, ...extra } = {}
) {
  const payload = { message, ...extra };

  if (campos_faltantes.length > 0) payload.campos_faltantes = campos_faltantes;
  if (Object.keys(campos_invalidos).length > 0) payload.campos_invalidos = campos_invalidos;

  return res.status(400).json(payload);
}

/** ¿Hay faltantes o inválidos? */
export function hayErrores(campos_faltantes = [], campos_invalidos = {}) {
  return campos_faltantes.length > 0 || Object.keys(campos_invalidos).length > 0;
}
