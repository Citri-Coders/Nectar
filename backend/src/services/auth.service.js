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
// Las sesiones se guardan en la tabla `sesiones` (SQLite), por lo que sobreviven
// a un reinicio del servidor. No se usan dependencias externas: todo el hash y
// la generación de tokens usan `node:crypto`.
// ============================================================================

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
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
export function crearSesion(usuario) {
  const db = getDb();
  const token = `${randomUUID()}.${randomBytes(16).toString('hex')}`;

  db.prepare(
    'INSERT INTO sesiones (token, username, rol, usuario_id) VALUES (?, ?, ?, ?)'
  ).run(token, usuario.username, usuario.rol, usuario.id ?? null);

  return { token, usuario };
}

// Devuelve el usuario de una sesión activa, o null si el token no es válido.
export function usuarioPorToken(token) {
  const valor = String(token ?? '').trim();
  if (!valor) return null;

  const db = getDb();
  const row = db
    .prepare('SELECT username, rol, usuario_id FROM sesiones WHERE token = ?')
    .get(valor);

  if (!row) return null;
  return { id: row.usuario_id ?? null, username: row.username, rol: row.rol };
}

// Cierra (invalida) una sesión. Devuelve true si existía.
export function cerrarSesion(token) {
  const valor = String(token ?? '').trim();
  if (!valor) return false;

  const db = getDb();
  const { changes } = db.prepare('DELETE FROM sesiones WHERE token = ?').run(valor);
  return changes > 0;
}
