import { Router } from 'express';
import {
  verifySeal,
  adoptHabitat,
  getProducers,
} from '../controllers/seal.controller.js';

const router = Router();

// GET /api/v1/seal/verify/:id_o_slug  -> ficha pública de trazabilidad (QR)
router.get('/verify/:id_o_slug', verifySeal);

// POST /api/v1/seal/adopt             -> adopción de m² de hábitat floral
router.post('/adopt', adoptHabitat);

// GET /api/v1/seal/producers          -> catálogo de productores certificados
router.get('/producers', getProducers);

export default router;
