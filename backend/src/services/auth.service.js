// ============================================================================
// Autenticación de la comunidad Néctar LatAm.
// ----------------------------------------------------------------------------
// Tres roles:
//     'usuario'       -> se registra con username + password (guardado en SQLite
//                        con hash scrypt). Puede ingresar datos.
//     'administrador' -> credenciales maestras (contraseña CLAVE_MAESTRA).
//                        Además de ingresar datos, puede eliminarlos.
//     'auditor'       -> credenciales maestras (misma contraseña). Solo consulta.
//
// Las sesiones se firman con HMAC (token autocontenido), por lo que no dependen
// de la base de datos ni de la memoria del proceso: sobreviven a reinicios y al
// modelo serverless de Vercel (varias instancias efímeras). No se usan
// dependencias externas: todo el hash y la firma usan `node:crypto`.
// ============================================================================

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getDb } from '../db/database.js';

// Roles admitidos por el sistema.
export const ROLES = ['usuario', 'administrador', 'auditor'];

// Contraseña maestra compartida por el administrador y el auditor.
// (Sencilla a propósito para este proyecto; no apta para producción real.)
export const CLAVE_MAESTRA = 'admin1234';

// Longitud mínima y máxima de la contraseña de una cuenta de usuario.
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 100;
// Longitud máxima del nombre de usuario.
const MAX_USERNAME = 30;

// Error de autenticación con código HTTP asociado (lo usa el controlador).
export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function normalizarUsername(username) {
  return String(username ?? '').trim().toLowerCase();
}

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

// Compara dos hashes hexadecimales en tiempo constante (evita ataques de timing).
function mismoHash(a, b) {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// ----------------------------------------------------------------------------
// Cambio entre la fila de la base y el objeto público (sin hash ni sal).
// ----------------------------------------------------------------------------
function usuarioPublico(row) {
  return { id: row.id ?? null, username: row.username, rol: row.rol };
}

// ----------------------------------------------------------------------------
// Registro de una cuenta de usuario (rol 'usuario').
// ----------------------------------------------------------------------------
export function registrarUsuario({ username, password } = {}) {
  const nombre = normalizarUsername(username);
  const clave = String(password ?? '');

  if (nombre.length < 3 || nombre.length > MAX_USERNAME) {
    throw new AuthError(`El usuario debe tener entre 3 y ${MAX_USERNAME} caracteres.`, 400);
  }
  if (!/^[a-z0-9._-]+$/.test(nombre)) {
    throw new AuthError(
      'El usuario solo puede tener letras, números, puntos, guiones y guion bajo.',
      400
    );
  }
  if (clave.length < MIN_PASSWORD || clave.length > MAX_PASSWORD) {
    throw new AuthError(
      `La contraseña debe tener entre ${MIN_PASSWORD} y ${MAX_PASSWORD} caracteres.`,
      400
    );
  }
  if (!/[a-zA-Z]/.test(clave) || !/[0-9]/.test(clave)) {
    throw new AuthError(
      'La contraseña debe combinar letras y números.',
      400
    );
  }

  const db = getDb();
  const existente = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(nombre);
  if (existente) {
    throw new AuthError('Ese usuario ya está registrado. Elige otro.', 409);
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(clave, salt);

  const { lastInsertRowid } = db
    .prepare('INSERT INTO usuarios (username, password_hash, salt, rol) VALUES (?, ?, ?, ?)')
    .run(nombre, passwordHash, salt, 'usuario');

  return crearSesion({ id: Number(lastInsertRowid), username: nombre, rol: 'usuario' });
}

// ----------------------------------------------------------------------------
// Inicio de sesión.
// El formulario ya no envía rol: se infiere de la cuenta registrada en la base
// (el usuario 'admin' tiene el rol 'administrador' y todos los permisos).
// Se mantiene `rol` opcional por compatibilidad con clientes antiguos.
// Devuelve { token, usuario }.
// ----------------------------------------------------------------------------
export function iniciarSesion({ username, password, rol } = {}) {
  const rolElegido = String(rol ?? '').trim().toLowerCase() || 'usuario';
  if (!ROLES.includes(rolElegido)) {
    throw new AuthError('Debes indicar un rol válido: usuario, administrador o auditor.', 400);
  }

  const clave = String(password ?? '');
  if (!clave) {
    throw new AuthError('Escribe tu contraseña.', 400);
  }
  if (clave.length > MAX_PASSWORD) {
    throw new AuthError('La contraseña es demasiado larga.', 400);
  }

  // Credenciales maestras: no consultan la base de datos.
  if (rolElegido !== 'usuario') {
    if (clave !== CLAVE_MAESTRA) {
      throw new AuthError('Contraseña maestra incorrecta.', 401);
    }

    const usuario = {
      id: null,
      username: rolElegido === 'administrador' ? 'Administrador' : 'Auditor',
      rol: rolElegido,
    };
    return crearSesion(usuario);
  }

  // Cuenta de usuario registrada.
  const nombre = normalizarUsername(username);
  if (!nombre) {
    throw new AuthError('Escribe tu usuario.', 400);
  }

  const db = getDb();
  const row = db
    .prepare('SELECT id, username, rol, password_hash, salt FROM usuarios WHERE username = ?')
    .get(nombre);

  if (!row || !mismoHash(row.password_hash, hashPassword(clave, row.salt))) {
    throw new AuthError('Usuario o contraseña incorrectos.', 401);
  }

  return crearSesion(usuarioPublico(row));
}

// ----------------------------------------------------------------------------
// Sesiones
// ----------------------------------------------------------------------------
// El token es un "JWT" casero:  <payload base64url>.<firma HMAC-SHA256>.
// Al ser autocontenido y verificable con un secreto, la sesión NO depende de la
// base de datos ni de memoria del proceso. Es imprescindible en Vercel, donde
// cada invocación puede correr en una instancia distinta cuyo sistema de
// archivos (y por tanto la base SQLite en /tmp) es efímero.
// ----------------------------------------------------------------------------

// Secreto para firmar los tokens. En producción define NECTAR_AUTH_SECRET; el
// valor por defecto sirve solo para desarrollo local.
const AUTH_SECRET = String(process.env.NECTAR_AUTH_SECRET ?? 'nectar-latam-dev-secret');

// Vigencia del token (30 días). Al expirar, el cliente deberá volver a entrar.
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function firmar(cuerpo) {
  return createHmac('sha256', AUTH_SECRET).update(cuerpo).digest('base64url');
}

export function crearSesion(usuario) {
  const payload = {
    sub: usuario.id ?? null,
    u: usuario.username,
    r: usuario.rol,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const cuerpo = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return { token: `${cuerpo}.${firmar(cuerpo)}`, usuario };
}

// Devuelve el usuario de un token válido (firma correcta y sin expirar), o null.
export function usuarioPorToken(token) {
  const valor = String(token ?? '').trim();
  const [cuerpo, firma] = valor.split('.');
  if (!cuerpo || !firma) return null;

  const esperada = firmar(cuerpo);
  const recibida = Buffer.from(firma);
  const calculada = Buffer.from(esperada);
  if (recibida.length !== calculada.length || !timingSafeEqual(recibida, calculada)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  return { id: payload.sub ?? null, username: payload.u, rol: payload.r };
}

// Con tokens autocontenidos no hay estado en el servidor que revocar: el cierre
// de sesión ocurre en el cliente al descartar el token. Se conserva la función
// para no cambiar la API pública del servicio.
export function cerrarSesion() {
  return false;
}
