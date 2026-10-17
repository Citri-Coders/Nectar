/** Opción con valor de API + etiqueta legible + emoji para las tarjetas. */
export interface CatalogOption {
  value: string;
  label: string;
  icon?: string;
  desc?: string;
}

/* -------------------------------------------------------------------------- */
/* Paso 1 — Ubicación                                                         */
/* -------------------------------------------------------------------------- */

export const ZONAS: CatalogOption[] = [
  { value: 'urbana', label: 'Urbana', icon: '🏙️', desc: 'Dentro de la ciudad' },
  { value: 'periurbana', label: 'Periurbana', icon: '🌆', desc: 'Borde urbano-rural' },
  { value: 'rural', label: 'Rural', icon: '🌄', desc: 'Campo abierto' },
];

/* -------------------------------------------------------------------------- */
/* Paso 2 — Tipo de espacio                                                   */
/* -------------------------------------------------------------------------- */

export const TIPOS_ESPACIO: CatalogOption[] = [
  { value: 'finca_agricola', label: 'Finca agrícola', icon: '🌱', desc: 'Producción a escala' },
  { value: 'patio_jardin', label: 'Patio o jardín', icon: '🌼', desc: 'Espacio familiar' },
  { value: 'terraza_balcon', label: 'Terraza o balcón', icon: '🪴', desc: 'Espacio pequeño' },
  { value: 'escuela', label: 'Escuela', icon: '🏫', desc: 'Educación y comunidad' },
  { value: 'parque_rotonda', label: 'Parque o rotonda', icon: '🌳', desc: 'Área pública verde' },
  { value: 'area_comunal', label: 'Área comunal', icon: '🤝', desc: 'Terreno compartido' },
];

/* -------------------------------------------------------------------------- */
/* Paso 3 — Cultivo o vegetación                                              */
/* -------------------------------------------------------------------------- */

export const CULTIVOS: CatalogOption[] = [
  { value: 'cafe', label: 'Café', icon: '☕' },
  { value: 'cacao', label: 'Cacao', icon: '🍫' },
  { value: 'hortalizas', label: 'Hortalizas', icon: '🥬' },
  { value: 'frutales', label: 'Frutales', icon: '🥭' },
  { value: 'ornamentales', label: 'Ornamentales', icon: '🌺' },
  { value: 'sin_cultivo', label: 'Sin cultivo', icon: '🌾' },
];

/* -------------------------------------------------------------------------- */
/* Paso 4 — Piso climático                                                    */
/* -------------------------------------------------------------------------- */

export const PISOS_CLIMATICOS: CatalogOption[] = [
  { value: 'calido_seco', label: 'Cálido seco', icon: '🌵', desc: '0 – 500 msnm' },
  { value: 'calido_humedo', label: 'Cálido húmedo', icon: '🌴', desc: '0 – 800 msnm' },
  { value: 'templado', label: 'Templado', icon: '🌤️', desc: '800 – 1500 msnm' },
  { value: 'frio', label: 'Frío', icon: '🏔️', desc: '1500+ msnm' },
];

/* -------------------------------------------------------------------------- */
/* Prácticas agroecológicas                                                   */
/* -------------------------------------------------------------------------- */

export const PRACTICAS: CatalogOption[] = [
  { value: 'franja_floral', label: 'Franja floral', icon: '🌸' },
  { value: 'cerca_viva', label: 'Cerca viva', icon: '🌿' },
  { value: 'nidos', label: 'Nidos o cajas racionales', icon: '🐝' },
  { value: 'compostaje', label: 'Compostaje', icon: '♻️' },
];

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/** Devuelve la etiqueta legible de un valor de API. */
export function labelOf(options: CatalogOption[], value?: string | null): string {
  if (!value) return '—';
  const found = options.find((option) => option.value === value);
  if (found) return found.label;
  // Valores desconocidos: "sin_cultivo" -> "Sin cultivo"
  return value
    .replace(/_/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}

export const tipoEspacioLabel = (value?: string | null) => labelOf(TIPOS_ESPACIO, value);
export const cultivoLabel = (value?: string | null) => labelOf(CULTIVOS, value);
export const pisoLabel = (value?: string | null) => labelOf(PISOS_CLIMATICOS, value);
export const zonaLabel = (value?: string | null) => labelOf(ZONAS, value);
export const practicaLabel = (value?: string | null) => labelOf(PRACTICAS, value);

/** Color de pin en el mapa según el cultivo (para el componente Leaflet). */
export const COLOR_POR_CULTIVO: Record<string, string> = {
  cafe: '#245C43',
  cacao: '#7d621a',
  hortalizas: '#5f7a53',
  frutales: '#d3ab34',
  ornamentales: '#abc3a0',
  sin_cultivo: '#4a7396',
};

export function colorPorCultivo(cultivo?: string | null): string {
  return (cultivo && COLOR_POR_CULTIVO[cultivo]) || '#245C43';
}

/** Emoji del pin del mapa según el cultivo. */
export const EMOJI_POR_CULTIVO: Record<string, string> = {
  cafe: '☕',
  cacao: '🍫',
  hortalizas: '🥬',
  frutales: '🥭',
  ornamentales: '🌺',
  sin_cultivo: '🌾',
};

export function emojiPorCultivo(cultivo?: string | null): string {
  return (cultivo && EMOJI_POR_CULTIVO[cultivo]) || '🐝';
}

/** Municipios sugeridos según las semillas del backend. */
export const MUNICIPIOS_SUGERIDOS = ['Matagalpa', 'Pitalito, Huila'];
