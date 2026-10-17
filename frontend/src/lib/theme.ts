/**
 * Tema visual (claro / oscuro).
 *
 * La preferencia se guarda en `localStorage` y, si no existe, se respeta la del
 * sistema operativo. El atributo `data-theme` del elemento `<html>` es el que
 * activa los estilos oscuros definidos en las hojas de estilo.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'nectar-theme';

/** Tema preferido por el sistema operativo. */
export function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Tema guardado explícitamente por la persona usuaria, o null si no hay. */
export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/** Tema aplicado actualmente en el documento. */
export function getCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Aplica el tema al documento y lo persiste. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Almacenamiento no disponible: aplicamos el tema sin persistirlo.
  }
}

/**
 * Tema inicial: la preferencia guardada o, en su defecto, el tema ya aplicado
 * por el script de arranque de `index.html` (sistema operativo).
 */
export function initialTheme(): Theme {
  return getStoredTheme() ?? getCurrentTheme();
}
