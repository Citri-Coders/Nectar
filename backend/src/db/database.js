// ============================================================================
// Conexión a la base de datos de biodiversidad (Néctar LatAm).
// ----------------------------------------------------------------------------
// Soporta dos modos:
// 1. Turso (Cloud libSQL): cuando TURSO_DATABASE_URL y TURSO_AUTH_TOKEN
//    están presentes. Proporciona persistencia real en serverless (Vercel) y
//    producción.
// 2. SQLite local: cuando no hay credenciales de Turso. Usa el módulo nativo
//    `node:sqlite` (Node >= 22). En Vercel usa /tmp (efímero) y en local backend/db.
// ============================================================================

import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Carga automática de variables de entorno desde .env si no están presentes
function cargarEnvSiExiste() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) return;
  const posiblesRutas = [
    resolve(process.cwd(), '.env'),
    resolve(here, '..', '..', '.env'),
    resolve(here, '..', '.env'),
  ];
  for (const ruta of posiblesRutas) {
    if (existsSync(ruta)) {
      try {
        const contenido = readFileSync(ruta, 'utf8');
        for (const linea of contenido.split('\n')) {
          const limpia = linea.trim();
          if (!limpia || limpia.startsWith('#')) continue;
          const [clave, ...resto] = limpia.split('=');
          if (clave && resto.length && !process.env[clave.trim()]) {
            process.env[clave.trim()] = resto.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      } catch {}
      break;
    }
  }
}

cargarEnvSiExiste();

const IS_SERVERLESS = Boolean(process.env.VERCEL);
const DB_DIR = IS_SERVERLESS
  ? resolve(process.cwd(), 'backend', 'db')
  : resolve(here, '..', '..', 'db');
const SCHEMA_PATH = join(DB_DIR, 'schema.sql');
const SEED_PATH = join(DB_DIR, 'seed.sql');

const SCHEMA_VERSION = 3;
const TABLAS = [
  'sesiones',
  'usuarios',
  'municipio_polinizador',
  'pais_polinizador',
  'polinizadores',
  'municipios',
  'paises',
];

const DEFAULT_DB_PATH = IS_SERVERLESS
  ? join(tmpdir(), 'nectar.sqlite')
  : join(DB_DIR, 'nectar.sqlite');

export const DB_PATH = process.env.NECTAR_DB_PATH ?? DEFAULT_DB_PATH;

export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

export const isTurso = Boolean(TURSO_DATABASE_URL && TURSO_AUTH_TOKEN);

/** @type {any} */
let tursoClient = null;
/** @type {DatabaseSync | null} */
let localDb = null;

// Inicializa cliente Turso con @libsql/client de forma síncrona/perezosa
async function getTursoClient() {
  if (!tursoClient) {
    const { createClient } = await import('@libsql/client');
    tursoClient = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return tursoClient;
}

// Crea la conexión local SQLite y garantiza esquema + semilla
function getLocalConnection() {
  if (localDb) return localDb;

  const connection = new DatabaseSync(DB_PATH);
  connection.exec('PRAGMA foreign_keys = ON;');

  const { user_version: version } = connection.prepare('PRAGMA user_version').get();
  if (version !== SCHEMA_VERSION) {
    connection.exec('PRAGMA foreign_keys = OFF;');
    for (const tabla of TABLAS) connection.exec(`DROP TABLE IF EXISTS ${tabla};`);
    connection.exec('PRAGMA foreign_keys = ON;');
  }

  connection.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  connection.exec(readFileSync(SEED_PATH, 'utf8'));
  asegurarCuentaAdminLocal(connection);

  connection.exec(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  localDb = connection;
  return localDb;
}

function asegurarCuentaAdminLocal(connection) {
  const username = 'admin';
  const password = 'admin2004';

  const existente = connection
    .prepare('SELECT id, rol FROM usuarios WHERE username = ?')
    .get(username);

  if (existente) {
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
 * Ejecuta una consulta SQL y devuelve la primera fila mapeada o null.
 * @param {string} sql
 * @param {any[]} args
 */
export async function queryOne(sql, args = []) {
  if (isTurso) {
    const client = await getTursoClient();
    const res = await client.execute({ sql, args });
    return res.rows[0] ?? null;
  }
  const db = getLocalConnection();
  return db.prepare(sql).get(...args) ?? null;
}

/**
 * Ejecuta una consulta SQL y devuelve todas las filas encontradas.
 * @param {string} sql
 * @param {any[]} args
 */
export async function queryAll(sql, args = []) {
  if (isTurso) {
    const client = await getTursoClient();
    const res = await client.execute({ sql, args });
    return res.rows;
  }
  const db = getLocalConnection();
  return db.prepare(sql).all(...args);
}

/**
 * Ejecuta una sentencia SQL de modificación (INSERT, UPDATE, DELETE).
 * @param {string} sql
 * @param {any[]} args
 */
export async function execute(sql, args = []) {
  if (isTurso) {
    const client = await getTursoClient();
    const res = await client.execute({ sql, args });
    return {
      affectedRows: Number(res.rowsAffected ?? 0),
      lastInsertRowid: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null
        ? Number(res.lastInsertRowid)
        : null,
    };
  }
  const db = getLocalConnection();
  const res = db.prepare(sql).run(...args);
  return {
    affectedRows: Number(res.changes ?? 0),
    lastInsertRowid: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null
      ? Number(res.lastInsertRowid)
      : null,
  };
}

/**
 * Ejecuta un bloque con múltiples sentencias SQL (DDL, migraciones).
 * @param {string} sql
 */
export async function executeMultiple(sql) {
  if (isTurso) {
    const client = await getTursoClient();
    await client.executeMultiple(sql);
    return;
  }
  const db = getLocalConnection();
  db.exec(sql);
}

/** Indica si la base de datos está disponible (Turso o SQLite local). */
export async function isDatabaseAvailable() {
  try {
    if (isTurso) {
      const client = await getTursoClient();
      await client.execute('SELECT 1;');
      return true;
    }
    getLocalConnection();
    return true;
  } catch (error) {
    console.error('[biodiversidad] error en base de datos:', error.message);
    return false;
  }
}

/** Devuelve la conexión local directa si se usa SQLite local (compatibilidad). */
export function getDb() {
  if (isTurso) {
    throw new Error('La base de datos está configurada con Turso (asíncrono). Usa queryOne, queryAll o execute.');
  }
  return getLocalConnection();
}

// Ejecución directa para pruebas o db:init
if (process.argv[1]?.endsWith('database.js')) {
  (async () => {
    const modo = isTurso ? `Turso (${TURSO_DATABASE_URL})` : `SQLite local (${DB_PATH})`;
    console.log(`📡 Conectando a ${modo}...`);
    const row = await queryOne('SELECT COUNT(*) AS total FROM paises');
    console.log(`✅ Base de datos lista con ${row?.total ?? 0} países.`);
  })().catch(console.error);
}
