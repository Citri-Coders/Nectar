// ============================================================================
// Copia el build del SPA (frontend/dist) al directorio public/ de la raíz.
// ----------------------------------------------------------------------------
// Vercel sirve como estáticos los archivos de public/** desde su CDN. El
// documento del preset de Express indica que `express.static()` se ignora, por
// lo que la SPA compilada debe vivir en public/.
// ============================================================================

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'frontend', 'dist');
const to = resolve(root, 'public');

if (!existsSync(from)) {
  console.error(`[build] No existe ${from}. Ejecuta primero "npm --prefix frontend run build".`);
  process.exit(1);
}

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });

console.log(`[build] Frontend copiado a ${to}`);
