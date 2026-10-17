import { findSpaceById } from './spacesData.js';

// ---------------------------------------------------------------------------
// Persistencia en memoria (se reinicia con el servidor).
// ---------------------------------------------------------------------------
const certificaciones = [];
const adopciones = [];
let secuenciaAdopcion = 1;

// Nombres comunes de los polinizadores para la ficha pública.
const NOMBRES_COMUNES = {
  'Melipona beecheii': 'Abeja Chupapié',
  Xylocopa: 'Abeja Carpintera',
  Centris: 'Abeja Solitaria del Aceite',
  'Trigona fulviventris': 'Abeja Jicote',
  'Melipona compressipes': 'Abeja Jandaíra',
  'Tetragonisca angustula': 'Abeja Angelita',
  Scaptotrigona: 'Abeja Culo de Vaca',
  'Melipona rufiventris': 'Abeja Uruçu',
  'Melipona quadrifasciata': 'Abeja Mandaçaia',
  Tetragonisca: 'Abeja Jataí',
};

// Descripción comercial del cultivo según el tipo registrado.
const DESCRIPCION_CULTIVO = {
  cafe: 'Café de Sombra Especial',
  cacao: 'Cacao Fino de Aroma',
  hortalizas: 'Hortalizas Agroecológicas',
  frutales: 'Frutales Nativos',
  ornamentales: 'Plantas Ornamentales Nativas',
  sin_cultivo: 'Jardín Polinizador Educativo',
};

// Traducción de las prácticas registradas a lenguaje verificable.
const DESCRIPCION_PRACTICA = {
  cerca_viva: 'Cercas vivas florales con especies nativas',
  franja_floral: 'Franjas florales con especies nativas',
  nidos: 'Cajas racionales de abejas sin aguijón',
  compostaje: 'Compostaje de residuos orgánicos',
};

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

function formatearPolinizador(nombre) {
  const comun = NOMBRES_COMUNES[nombre];
  return comun ? `${nombre} (${comun})` : nombre;
}

function derivarPolinizadores(space) {
  return [space.polinizador_principal, space.polinizador_secundario]
    .filter(Boolean)
    .map(formatearPolinizador);
}

function derivarPracticasVerificadas(space) {
  const practicas = (space.practicas ?? []).map(
    (practica) => DESCRIPCION_PRACTICA[practica] ?? practica
  );
  practicas.push('0% pesticidas neonicotinoides');
  return practicas;
}

// Construye una certificación completando los campos faltantes desde el espacio.
function construirCertificacion(seed) {
  const space = findSpaceById(seed.espacio_id);
  if (!space) return null;

  return {
    espacio_id: space.id,
    slug: seed.slug ?? slugify(space.nombre_espacio),
    folio_certificacion: seed.folio_certificacion,
    productor: seed.productor,
    cultivo:
      seed.cultivo ??
      DESCRIPCION_CULTIVO[space.cultivo_vegetacion] ??
      'Producción agroecológica',
    polinizadores_protegidos: seed.polinizadores_protegidos ?? derivarPolinizadores(space),
    practicas_verificadas: seed.practicas_verificadas ?? derivarPracticasVerificadas(space),
    metros_cuadrados_habitat_activo: seed.metros_cuadrados_habitat_activo,
    fecha_certificacion: seed.fecha_certificacion,
    activo: seed.activo ?? true,
  };
}

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

// ---------------------------------------------------------------------------
// --- Semillas ---
// Certificación destacada de "Finca El Mirador" (Matagalpa, Nicaragua) +
// el resto de fincas con Sello "Polinizador Amigo" activo.
// ---------------------------------------------------------------------------
const SELLOS_SEMILLA = [
  {
    espacio_id: 'esp-101',
    slug: 'finca-el-mirador',
    folio_certificacion: 'SELLO-NIC-2026-004',
    productor: 'Don Pedro Morales',
    cultivo: 'Café de Sombra Especial (Caturra / Borbón)',
    polinizadores_protegidos: [
      'Melipona beecheii (Abeja Chupapié)',
      'Xylocopa (Abeja Carpintera)',
    ],
    practicas_verificadas: [
      'Cercas vivas florales con Madero Negro',
      '18 cajas racionales de abejas sin aguijón',
      '0% pesticidas neonicotinoides',
    ],
    metros_cuadrados_habitat_activo: 12500,
    fecha_certificacion: '2026-02-15',
  },
  { espacio_id: 'esp-103', folio_certificacion: 'SELLO-NIC-2026-011', productor: 'Doña Rosa Martínez',      metros_cuadrados_habitat_activo: 8200,  fecha_certificacion: '2026-03-04' },
  { espacio_id: 'esp-105', folio_certificacion: 'SELLO-NIC-2026-017', productor: 'Escuela El Arenal',       metros_cuadrados_habitat_activo: 3200,  fecha_certificacion: '2026-03-18' },
  { espacio_id: 'esp-108', folio_certificacion: 'SELLO-NIC-2026-023', productor: 'Familia Gutiérrez',       metros_cuadrados_habitat_activo: 9600,  fecha_certificacion: '2026-04-02' },
  { espacio_id: 'esp-110', folio_certificacion: 'SELLO-NIC-2026-029', productor: 'Don Ramón Zelaya',        metros_cuadrados_habitat_activo: 10400, fecha_certificacion: '2026-04-21' },
  { espacio_id: 'esp-113', folio_certificacion: 'SELLO-NIC-2026-034', productor: 'Cooperativa Yasica Sur',  metros_cuadrados_habitat_activo: 15000, fecha_certificacion: '2026-05-09' },
];

for (const semilla of SELLOS_SEMILLA) {
  const certificacion = construirCertificacion(semilla);
  if (certificacion) certificaciones.push(certificacion);
}

// Adopciones previas de consumidores: 340 m² para Finca El Mirador.
const ADOPCIONES_SEMILLA = [
  { espacio_id: 'esp-101', nombre_consumidor: 'Cooperativa Los Pinos', metros_cuadrados: 120, monto_usd: 60, mensaje_apoyo: 'Apoyamos la conservación desde Managua.', fecha_adopcion: '2026-06-10' },
  { espacio_id: 'esp-101', nombre_consumidor: 'María Fernanda Rivas',  metros_cuadrados: 100, monto_usd: 50, mensaje_apoyo: '¡Que vivan las abejas nativas!',          fecha_adopcion: '2026-07-02' },
  { espacio_id: 'esp-101', nombre_consumidor: 'Café con Causa',        metros_cuadrados: 80,  monto_usd: 40, mensaje_apoyo: 'Orgullosos de apoyar a Matagalpa.',        fecha_adopcion: '2026-08-15' },
  { espacio_id: 'esp-101', nombre_consumidor: 'Carlos Rivas',          metros_cuadrados: 40,  monto_usd: 20, mensaje_apoyo: 'Para que sigan polinizando el café.',      fecha_adopcion: '2026-09-01' },
];

for (const semilla of ADOPCIONES_SEMILLA) {
  createAdoption(semilla);
}
