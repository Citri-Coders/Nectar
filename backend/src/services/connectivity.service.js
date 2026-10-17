// Algoritmo de conectividad de microcuenca (0% a 100%).
//
// Combina tres componentes ponderados:
//   1. Densidad de espacios registrados (fincas, patios, escuelas).
//   2. Cantidad de cercas vivas (corredores biológicos entre parches).
//   3. Variedad de prácticas agroecológicas implementadas.
//
// Cada componente se satura en su valor de referencia (nunca supera 1),
// de modo que el resultado siempre queda acotado entre 0 y 100.

const PESO_DENSIDAD = 0.35;
const PESO_CERCAS = 0.35;
const PESO_VARIEDAD = 0.30;

const ESPACIOS_REFERENCIA = 25; // espacios que representan buena densidad
const CERCAS_REFERENCIA = 21;   // cercas vivas para conectividad plena
const TIPOS_REFERENCIA = 4;     // prácticas distintas para variedad plena

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Cuenta cercas vivas y la variedad de prácticas de un conjunto de espacios.
function analizarPracticas(spaces) {
  let cercasVivas = 0;
  const tipos = new Set();

  for (const space of spaces) {
    const practicas = Array.isArray(space.practicas) ? space.practicas : [];
    for (const practica of practicas) {
      const clave = normalize(practica);
      if (!clave) continue;
      tipos.add(clave);
      if (clave.includes('cerca')) cercasVivas += 1;
    }
  }

  return { cercasVivas, tipos: tipos.size };
}

/**
 * Devuelve el detalle del cálculo de conectividad:
 * porcentaje final, subcomponentes (0-100) y datos crudos usados.
 */
export function calcularConectividadDetalle(spaces = []) {
  const totalEspacios = spaces.length;
  const { cercasVivas, tipos } = analizarPracticas(spaces);

  const densidad = Math.min(totalEspacios / ESPACIOS_REFERENCIA, 1);
  const conectividadCercas = Math.min(cercasVivas / CERCAS_REFERENCIA, 1);
  const variedad = Math.min(tipos / TIPOS_REFERENCIA, 1);

  const indice =
    densidad * PESO_DENSIDAD +
    conectividadCercas * PESO_CERCAS +
    variedad * PESO_VARIEDAD;

  return {
    porcentaje: Math.round(indice * 100),
    componentes: {
      densidad_espacios: Math.round(densidad * 100),
      cercas_vivas: Math.round(conectividadCercas * 100),
      variedad_practicas: Math.round(variedad * 100),
    },
    detalles: {
      total_espacios: totalEspacios,
      cercas_vivas: cercasVivas,
      tipos_practicas: tipos,
    },
  };
}

// Atajo que devuelve solo el porcentaje (0-100).
export function calcularIndiceConectividad(spaces = []) {
  return calcularConectividadDetalle(spaces).porcentaje;
}
