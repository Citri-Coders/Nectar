import { Router } from 'express';
import { login, logout, perfil, registro } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/auth/registro -> crea una cuenta de usuario (rol 'usuario')
router.post('/registro', registro);

// POST /api/v1/auth/login    -> usuario registrado o credenciales maestras
router.post('/login', login);

// POST /api/v1/auth/logout   -> invalida el token de la sesión
router.post('/logout', logout);

// GET  /api/v1/auth/me       -> perfil de la sesión actual
router.get('/me', requireAuth, perfil);

export default router;
