import { Router } from 'express';
import {
  deleteSpace,
  getAllSpaces,
  getSpaceById,
  segmentSpace,
} from '../controllers/spaces.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/spaces/segmentation  -> registra un espacio con recomendación
// Requiere sesión (usuario o administrador; el auditor solo consulta).
router.post('/segmentation', requireAuth, requireRole('usuario', 'administrador'), segmentSpace);

// GET /api/v1/spaces               -> lista (filtros: ?pais= ?tipo=)
router.get('/', requireAuth, getAllSpaces);

// GET /api/v1/spaces/:id           -> detalle por id
router.get('/:id', requireAuth, getSpaceById);

// DELETE /api/v1/spaces/:id        -> elimina el espacio (solo administrador)
router.delete('/:id', requireAuth, requireRole('administrador'), deleteSpace);

export default router;
