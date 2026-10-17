import speciesData from '../data/speciesData.js';

/**
 * Preferencia de polinizador principal según el cultivo o vegetación.
 *  - 'sinAguijon': abejas meliponas / trigonas (manejables en cajas racionales).
 *  - 'solitarias': Xylocopa, Centris (grandes, muy eficientes en varios cultivos).
 */
const PREFERENCIA_POR_CULTIVO = {
  cafe: {
    grupo: 'sinAguijon',
    nota: 'Las abejas sin aguijón y las Xylocopa mejoran el cuajado y la calidad del café.',
  },
  cacao: {
    grupo: 'sinAguijon',
    nota: 'El cacao también depende de moscas polinizadoras (Forcipomyia spp.).',
  },
  hortalizas: {
    grupo: 'solitarias',
    nota: 'Centris y Xylocopa polinizan por vibración, clave en hortalizas como el tomate.',
  },
  frutales: {
    grupo: 'solitarias',
    nota: 'Las abejas solitarias de gran tamaño polinizan eficazmente los frutales.',
  },
  ornamentales: {
    grupo: 'sinAguijon',
    nota: 'Las abejas sin aguijón son generalistas y visitan muchas floraciones ornamentales.',
  },
  sin_cultivo: {
    grupo: 'sinAguijon',
    nota: 'En espacios sin cultivo se prioriza la biodiversidad generalista.',
  },
};

const NIDO_SIN_AGUIJON = 'Cajas racionales INPA';
const NIDO_SIN_AGUIJON_COMPACTO = 'Caja racional INPA (formato compacto para balcón)';
const NIDO_SOLITARIAS = 'Hoteles de caña o bambú (troncos perforados)';

const MAX_PLANTAS = 8;

// Quita tildes, espacios sobrantes y pasa a minúsculas.
function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Igual que normalize, pero unifica espacios como "_" (para valores tipo enum).
export function normalizeEnum(value) {
  return normalize(value).replace(/\s+/g, '_');
}

// Devuelve la lista de países soportados (clave canónica).
export function getSupportedCountries() {
  return Object.keys(speciesData);
}

// Resuelve la clave canónica del país sin importar mayúsculas o tildes.
export function findCountryKey(pais) {
  const objetivo = normalize(pais);
  if (!objetivo) return null;
  return Object.keys(speciesData).find((clave) => normalize(clave) === objetivo) ?? null;
}

// Selecciona entre 5 y 8 plantas nativas, priorizando las aptas para el piso climático.
function selectPlants(country, piso) {
  const catalogo =
    country.catalogoPlantas ??
    country.plantasNativas.map((nombre) => ({ nombre, climas: [] }));

  const aptas = catalogo.filter(
    (planta) => !planta.climas.length || planta.climas.includes(piso)
  );
  const noAptas = catalogo.filter((planta) => !aptas.includes(planta));

  return [...aptas, ...noAptas].slice(0, MAX_PLANTAS).map((planta) => planta.nombre);
}

// Sugiere el tipo de nido a partir del grupo de polinizador principal y el espacio.
function pickNido(grupoPrincipal, tipoEspacio) {
  if (grupoPrincipal === 'sinAguijon') {
    return tipoEspacio === 'terraza_balcon' ? NIDO_SIN_AGUIJON_COMPACTO : NIDO_SIN_AGUIJON;
  }
  return NIDO_SOLITARIAS;
}

/**
 * Algoritmo de segmentación: evalúa País + Tipo de espacio + Cultivo + Clima
 * y devuelve la recomendación personalizada del paso 5.
 */
export function getRecommendation(input = {}) {
  const paisKey = findCountryKey(input.pais);
  if (!paisKey) {
    const error = new Error(`País no soportado: "${input.pais}".`);
    error.code = 'PAIS_NO_SOPORTADO';
    throw error;
  }

  const country = speciesData[paisKey];
  const cultivo = normalizeEnum(input.cultivo_vegetacion);
  const piso = normalizeEnum(input.piso_climatico);
  const tipoEspacio = normalizeEnum(input.tipo_espacio);

  const preferencia = PREFERENCIA_POR_CULTIVO[cultivo] ?? {
    grupo: 'sinAguijon',
    nota: null,
  };

  // Ajustes de contexto: clima frío y espacios muy pequeños favorecen solitarias.
  let grupoPrincipal = preferencia.grupo;
  let motivoAjuste = null;

  if (piso === 'frio') {
    grupoPrincipal = 'solitarias';
    motivoAjuste = 'En pisos fríos (1500+ msnm) predominan las abejas solitarias de gran tamaño.';
  } else if (tipoEspacio === 'terraza_balcon') {
    grupoPrincipal = 'solitarias';
    motivoAjuste = 'En espacios pequeños conviene empezar con nidos de abejas solitarias.';
  }

  const grupos = {
    sinAguijon: country.abejasSinAguijon,
    solitarias: country.abejasSolitarias,
  };
  const grupoSecundario = grupoPrincipal === 'sinAguijon' ? 'solitarias' : 'sinAguijon';

  return {
    polinizador_principal: grupos[grupoPrincipal][0] ?? null,
    polinizador_secundario: grupos[grupoSecundario][0] ?? null,
    plantas_recomendadas: selectPlants(country, piso),
    nido_sugerido: pickNido(grupoPrincipal, tipoEspacio),
    grupo_polinizador: grupoPrincipal,
    nota_polinizacion: motivoAjuste ?? preferencia.nota,
  };
}

export default getRecommendation;
