// Middlewares de autenticación y autorización por rol.
//
//   requireAuth          -> exige una sesión válida (header Authorization: Bearer <token>).
//   requireRole('rol')   -> exige que la sesión tenga uno de los roles indicados.
//
// El acceso de lectura de la API es público; estos middlewares se aplican solo
// a las rutas que escriben (POST) o eliminan (DELETE).

import { usuarioPorToken } from '../services/auth.service.js';

// Extrae el token del header `Authorization: Bearer <token>`.
function leerToken(req) {
  const header = req.get('authorization') ?? '';
  const [tipo, valor] = header.split(' ');
  return tipo?.toLowerCase() === 'bearer' && valor ? valor.trim() : '';
}

// Deja `req.usuario` y `req.token` disponibles para los siguientes middlewares.
export function requireAuth(req, res, next) {
  try {
    const token = leerToken(req);
    const usuario = token ? usuarioPorToken(token) : null;

    if (!usuario) {
      return res.status(401).json({
        message: 'Debes iniciar sesión para realizar esta acción.',
      });
    }

    req.usuario = usuario;
    req.token = token;
    return next();
  } catch (error) {
    return res.status(503).json({
      message: 'No se pudo verificar la sesión. Intenta de nuevo más tarde.',
      detalle: error.message,
    });
  }
}

// Restringe el acceso a los roles indicados. Debe usarse después de requireAuth.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        message: 'Debes iniciar sesión para realizar esta acción.',
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        message: `Tu rol "${req.usuario.rol}" no tiene permisos para esta acción.`,
      });
    }

    return next();
  };
}
