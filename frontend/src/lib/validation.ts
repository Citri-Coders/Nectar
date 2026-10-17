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

/* -------------------------------------------------------------------------- */
/* Validaciones de texto y números                                            */
/* -------------------------------------------------------------------------- */

/** Valida un texto entre un mínimo y un máximo de caracteres. */
export function validarTexto(
  valor: string,
  { min = 1, max = 120 }: { min?: number; max?: number } = {}
): string | null {
  const texto = valor.trim();
  if (texto.length < min) {
    return min === 1 ? 'Este campo es obligatorio.' : `Debe tener al menos ${min} caracteres.`;
  }
  if (texto.length > max) return `No puede superar ${max} caracteres.`;
  return null;
}

/** Valida un entero dentro de un rango. */
export function validarEntero(
  valor: string,
  { min = 1, max = 1000 }: { min?: number; max?: number } = {}
): string | null {
  const numero = Number(valor);
  if (valor.trim() === '' || !Number.isFinite(numero) || !Number.isInteger(numero)) {
    return 'Debe ser un número entero.';
  }
  if (numero < min || numero > max) return `Debe estar entre ${min} y ${max}.`;
  return null;
}

/** Valida un número decimal dentro de un rango. */
export function validarNumero(
  valor: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER }: { min?: number; max?: number } = {}
): string | null {
  const numero = Number(valor);
  if (valor.trim() === '' || !Number.isFinite(numero)) return 'Debe ser un número.';
  if (numero < min || numero > max) return `Debe estar entre ${min} y ${max}.`;
  return null;
}

/** ¿El usuario cumple el formato admitido por la API? */
export function validarUsername(valor: string): string | null {
  const texto = valor.trim().toLowerCase();
  if (texto.length < 3 || texto.length > 30) return 'Debe tener entre 3 y 30 caracteres.';
  if (!/^[a-z0-9._-]+$/.test(texto)) {
    return 'Solo letras, números, puntos, guiones y guion bajo.';
  }
  return null;
}

/** Valida un correo electrónico con formato básico. */
export function esEmailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

/* -------------------------------------------------------------------------- */
/* Errores de la API                                                          */
/* -------------------------------------------------------------------------- */

export interface PayloadErrorApi {
  message?: string;
  campos_faltantes?: string[];
  campos_invalidos?: Record<string, string>;
}

// Nombres legibles de los campos que devuelve la API.
const ETIQUETAS_CAMPO: Record<string, string> = {
  nombre_espacio: 'Nombre del espacio',
  pais: 'País',
  tipo_espacio: 'Tipo de espacio',
  cultivo_vegetacion: 'Cultivo o vegetación',
  piso_climatico: 'Piso climático',
  zona: 'Zona',
  departamento_municipio: 'Municipio',
  comunidad: 'Comunidad',
  practicas: 'Prácticas',
  coordenadas: 'Ubicación',
  espacio_id: 'Espacio',
  polinizador_avistado: 'Polinizador avistado',
  cantidad: 'Cantidad',
  foto_url: 'Foto (URL)',
  notas: 'Notas',
  nombre_consumidor: 'Nombre',
  metros_cuadrados: 'Metros cuadrados',
  monto_usd: 'Monto',
  email: 'Correo',
  mensaje_apoyo: 'Mensaje',
  nombre_municipio: 'Municipio',
  username: 'Usuario',
  password: 'Contraseña',
};

/** Nombre legible de un campo de la API. */
export function etiquetaCampo(campo: string): string {
  return ETIQUETAS_CAMPO[campo] ?? campo.replace(/_/g, ' ');
}

/**
 * Convierte cualquier error (de validación local o de la API) en una lista de
 * mensajes para el banner de errores del formulario.
 */
export function mensajesDeError(error: unknown): string[] {
  const mensajes: string[] = [];
  const payload = (error as { payload?: PayloadErrorApi } | null)?.payload;

  if (payload) {
    if (payload.campos_faltantes?.length) {
      mensajes.push(
        `Campos obligatorios: ${payload.campos_faltantes.map(etiquetaCampo).join(', ')}.`
      );
    }
    if (payload.campos_invalidos) {
      for (const [campo, mensaje] of Object.entries(payload.campos_invalidos)) {
        mensajes.push(`${etiquetaCampo(campo)}: ${mensaje}`);
      }
    }
    if (mensajes.length === 0 && payload.message) mensajes.push(payload.message);
  }

  if (mensajes.length === 0 && error instanceof Error) mensajes.push(error.message);
  if (mensajes.length === 0) mensajes.push('Ocurrió un error inesperado.');

  return mensajes;
}

