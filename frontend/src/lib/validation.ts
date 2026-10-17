/**
 * Validaciones de formularios reutilizables.
 * Mantienen el valor original del usuario (solo se recortan espacios externos).
 */

/**
 * Valida una URL http(s) con dominio y ruta, y la devuelve tal cual la escribió
 * la persona (sin normalizar el formato original).
 */
export function validarUrl(valor: string): { valida: boolean; url: string } {
  const url = valor.trim();
  if (!url) return { valida: true, url: '' }; // Vacío = opcional.

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valida: false, url };
  }

  const protocoloOk = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  const dominioOk = parsed.hostname.includes('.') && !parsed.hostname.endsWith('.');

  return { valida: protocoloOk && dominioOk, url };
}

/** ¿Es una URL http(s) válida? El vacío se considera válido (campo opcional). */
export function esUrlValida(valor: string): boolean {
  return validarUrl(valor).valida;
}

/** Valida un monto/medida numérica que no puede ser negativa. */
export function validarNoNegativo(valor: string): { valida: boolean; numero: number } {
  const numero = Number(valor);
  const valida = valor.trim() !== '' && Number.isFinite(numero) && numero >= 0;
  return { valida, numero };
}
