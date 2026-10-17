import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Cargar .env manualmente si existe
try {
  const envContent = readFileSync(resolve(root, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = val;
    }
  }
} catch {}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ Falta TURSO_DATABASE_URL o TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function initTurso() {
  console.log('🔄 Conectando a Turso en', url);

  const schemaPath = resolve(root, 'backend', 'db', 'schema.sql');
  const seedPath = resolve(root, 'backend', 'db', 'seed.sql');

  const schemaSql = readFileSync(schemaPath, 'utf8');
  const seedSql = readFileSync(seedPath, 'utf8');

  console.log('⏳ Ejecutando schema.sql en Turso...');
  await client.executeMultiple(schemaSql);
  console.log('✅ schema.sql ejecutado con éxito.');

  console.log('⏳ Ejecutando seed.sql en Turso...');
  await client.executeMultiple(seedSql);
  console.log('✅ seed.sql ejecutado con éxito.');

  // Asegurar cuenta admin
  const adminUser = 'admin';
  const adminPass = 'admin2004';
  const existing = await client.execute({
    sql: 'SELECT id, rol FROM usuarios WHERE username = ?',
    args: [adminUser]
  });

  if (existing.rows.length === 0) {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(adminPass, salt, 64).toString('hex');
    await client.execute({
      sql: 'INSERT INTO usuarios (username, password_hash, salt, rol) VALUES (?, ?, ?, ?)',
      args: [adminUser, passwordHash, salt, 'administrador']
    });
    console.log('✅ Cuenta admin creada en Turso.');
  } else {
    console.log('ℹ️ Cuenta admin ya existía.');
  }

  // Verificación de datos
  const paisesRes = await client.execute('SELECT COUNT(*) as total FROM paises');
  const municipiosRes = await client.execute('SELECT COUNT(*) as total FROM municipios');
  const polinizadoresRes = await client.execute('SELECT COUNT(*) as total FROM polinizadores');
  const usuariosRes = await client.execute('SELECT COUNT(*) as total FROM usuarios');

  console.log(`\n🎉 Base de datos Turso inicializada:`);
  console.log(`   - Países: ${paisesRes.rows[0].total}`);
  console.log(`   - Municipios: ${municipiosRes.rows[0].total}`);
  console.log(`   - Polinizadores: ${polinizadoresRes.rows[0].total}`);
  console.log(`   - Usuarios: ${usuariosRes.rows[0].total}`);
}

initTurso().catch((err) => {
  console.error('❌ Error al inicializar Turso:', err);
  process.exit(1);
});
