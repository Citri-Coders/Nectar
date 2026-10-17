// ============================================================================
// Conexión a la base de datos SQLite de biodiversidad (Néctar LatAm).
// ----------------------------------------------------------------------------
// Usa el módulo nativo `node:sqlite` (Node >= 22), de modo que el proyecto no
// necesita dependencias adicionales. La base se crea y se pobla automáticamente
// la primera vez que se consulta:
//     1. ejecuta backend/db/schema.sql  (tablas, índices y vistas)
//     2. si no hay países, ejecuta backend/db/seed.sql (datos semilla)
//
// La ruta del archivo se puede sobreescribir con la variable de entorno
// NECTAR_DB_PATH (útil para pruebas).
// ============================================================================

import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// En Vercel la función se empaqueta en un bundle: se recomienda resolver las
// rutas desde process.cwd() en vez de import.meta.url/__dirname, y el único
// directorio con permiso de escritura es /tmp. Fuera de Vercel se mantiene la
// ruta tradicional backend/db para el desarrollo local.
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const DB_DIR = IS_SERVERLESS
  ? resolve(process.cwd(), 'backend', 'db')
  : resolve(here, '..', '..', 'db');
const SCHEMA_PATH = join(DB_DIR, 'schema.sql');
const SEED_PATH = join(DB_DIR, 'seed.sql');

// Versión del esquema. Al cambiarla, la base existente se reconstruye desde
// schema.sql + seed.sql. Las cuentas de usuario registradas viven en la misma
// base, por lo que un cambio de versión del esquema las elimina.
const SCHEMA_VERSION = 3;

// Tablas en orden inverso de dependencias (para reconstruir sin violar FKs).
const TABLAS = [
  'sesiones',
  'usuarios',
  'municipio_polinizador',
  'pais_polinizador',
  'polinizadores',
  'municipios',
  'paises',
];

// En serverless (Vercel) el sistema de archivos es de solo lectura salvo /tmp,
// por lo que la base se crea ahí en cada arranque en frío (los datos no
// persisten entre invocaciones). Se puede forzar otra ruta con NECTAR_DB_PATH.
const DEFAULT_DB_PATH = IS_SERVERLESS
  ? join(tmpdir(), 'nectar.sqlite')
  : join(DB_DIR, 'nectar.sqlite');

export const DB_PATH = process.env.NECTAR_DB_PATH ?? DEFAULT_DB_PATH;

/** @type {DatabaseSync | null} */
let db = null;

// Crea la conexión y garantiza que exista la estructura + semilla.
function connect() {
  const connection = new DatabaseSync(DB_PATH);
  connection.exec('PRAGMA foreign_keys = ON;');

  const { user_version: version } = connection.prepare('PRAGMA user_version').get();
  if (version !== SCHEMA_VERSION) {
    // Esquema antiguo o recién creado: se recrea la estructura.
    connection.exec('PRAGMA foreign_keys = OFF;');
    for (const tabla of TABLAS) connection.exec(`DROP TABLE IF EXISTS ${tabla};`);
    connection.exec('PRAGMA foreign_keys = ON;');
  }

  connection.exec(readFileSync(SCHEMA_PATH, 'utf8'));

  // La semilla es idempotente (INSERT OR IGNORE), por lo que se ejecuta siempre:
  // así los municipios/polinizadores nuevos se incorporan sin recrear la base.
  connection.exec(readFileSync(SEED_PATH, 'utf8'));

  asegurarCuentaAdmin(connection);

  connection.exec(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  return connection;
}

// ----------------------------------------------------------------------------
// Cuenta de administrador interna.
// Se crea de forma automática en la primera apertura de la base. Tiene el rol
// 'administrador', por lo que da acceso total al proyecto (eliminar datos,
// administrar el contenido, etc.).
// ----------------------------------------------------------------------------
function asegurarCuentaAdmin(connection) {
  const username = 'admin';
  const password = 'admin2004';

  const existente = connection
    .prepare('SELECT id, rol FROM usuarios WHERE username = ?')
    .get(username);

  if (existente) {
    // Se garantiza que conserve el rol con todos los permisos.
    if (existente.rol !== 'administrador') {
      connection
        .prepare("UPDATE usuarios SET rol = 'administrador' WHERE id = ?")
        .run(existente.id);
    }
    return;
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');

  connection
    .prepare('INSERT INTO usuarios (username, password_hash, salt, rol) VALUES (?, ?, ?, ?)')
    .run(username, passwordHash, salt, 'administrador');
}

/**
 * Devuelve la conexión SQLite (singleton). Se inicializa de forma perezosa para
 * que un fallo de la base de datos no impida arrancar el resto de la API.
 */
export function getDb() {
  if (!db) db = connect();
  return db;
}

/** Indica si la base de datos está disponible (sin lanzar errores). */
export function isDatabaseAvailable() {
  try {
    getDb();
    return true;
  } catch (error) {
    console.error('[biodiversidad] no se pudo abrir la base de datos:', error.message);
    return false;
  }
}

// Permite inicializar la base manualmente:   npm run db:init
if (process.argv[1]?.endsWith('database.js')) {
  getDb();
  const { total } = getDb().prepare('SELECT COUNT(*) AS total FROM paises').get();
  console.log(`✅ Base de datos lista en ${DB_PATH} (${total} países).`);
}
