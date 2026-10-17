// Controlador de autenticación: registro, login, logout y perfil.

import {
  AuthError,
  ROLES,
  cerrarSesion,
  iniciarSesion,
  registrarUsuario,
} from '../services/auth.service.js';

// Responde con el error de autenticación (o 503 si la base no está disponible).
function responderError(res, error) {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error('[auth]', error);
  return res.status(503).json({
    message: 'No se pudo procesar la autenticación en este momento.',
  });
}

// POST /api/v1/auth/registro  -> crea una cuenta (rol 'usuario') e inicia sesión.
export async function registro(req, res) {
  try {
    const { token, usuario } = await registrarUsuario(req.body ?? {});
    return res.status(201).json({ mensaje: 'Cuenta creada con éxito.', token, usuario });
  } catch (error) {
    return responderError(res, error);
  }
}

// POST /api/v1/auth/login  -> inicia sesión con usuario o credenciales maestras.
export async function login(req, res) {
  try {
    const { token, usuario } = await iniciarSesion(req.body ?? {});
    return res.json({ mensaje: `Bienvenido, ${usuario.username}.`, token, usuario });
  } catch (error) {
    return responderError(res, error);
  }
}

// POST /api/v1/auth/logout  -> cierra la sesión del token recibido.
export function logout(req, res) {
  try {
    const header = req.get('authorization') ?? '';
    const [tipo, valor] = header.split(' ');
    const token = tipo?.toLowerCase() === 'bearer' ? valor : '';

    cerrarSesion(token);
    return res.json({ mensaje: 'Sesión cerrada.' });
  } catch (error) {
    return responderError(res, error);
  }
}

// GET /api/v1/auth/me  -> perfil de la sesión actual.
export function perfil(req, res) {
  return res.json({ usuario: req.usuario, roles_disponibles: ROLES });
}
