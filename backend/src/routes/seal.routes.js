import { Router } from 'express';
import {
  verifySeal,
  adoptHabitat,
  getProducers,
} from '../controllers/seal.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/seal/verify/:id_o_slug  -> ficha pública de trazabilidad (QR)
router.get('/verify/:id_o_slug', verifySeal);

// POST /api/v1/seal/adopt             -> adopción de m² de hábitat floral
// Requiere sesión (usuario o administrador; el auditor solo consulta).
router.post('/adopt', requireAuth, requireRole('usuario', 'administrador'), adoptHabitat);

// GET /api/v1/seal/producers          -> catálogo público de productores certificados
router.get('/producers', getProducers);

export default router;
