// Sello "Polinizador Amigo": certificaciones y adopciones de hábitat floral.
// Persistencia en memoria (se reinicia con el servidor).

const certificaciones = [];
const adopciones = [];
let secuenciaAdopcion = 1;

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function slugify(texto) {
  return normalize(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Busca una certificación por id de espacio, slug o folio.
export function findCertification(idOSlug) {
  const objetivo = normalize(idOSlug);
  if (!objetivo) return null;
  return (
    certificaciones.find(
      (cert) =>
        normalize(cert.espacio_id) === objetivo ||
        normalize(cert.slug) === objetivo ||
        normalize(cert.folio_certificacion) === objetivo
    ) ?? null
  );
}

export function listCertifications() {
  return certificaciones;
}

// Metros cuadrados ya adoptados por consumidores para un espacio.
export function getAdoptedM2(espacioId) {
  return adopciones
    .filter((adopcion) => adopcion.espacio_id === espacioId)
    .reduce((total, adopcion) => total + adopcion.metros_cuadrados, 0);
}

export function createAdoption(payload = {}) {
  const adopcion = {
    id: `adop-${secuenciaAdopcion++}`,
    espacio_id: payload.espacio_id,
    nombre_consumidor: payload.nombre_consumidor ?? null,
    email: payload.email ?? null,
    metros_cuadrados: Number(payload.metros_cuadrados),
    monto_usd: Number(payload.monto_usd),
    mensaje_apoyo: payload.mensaje_apoyo ?? null,
    fecha_adopcion: payload.fecha_adopcion ?? new Date().toISOString(),
  };

  adopciones.push(adopcion);
  return adopcion;
}
