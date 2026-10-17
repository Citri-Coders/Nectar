import { Router } from 'express';
import {
  segmentSpace,
  getAllSpaces,
  getSpaceById,
} from '../controllers/spaces.controller.js';

const router = Router();

// POST /api/v1/spaces/segmentation  -> registra un espacio con recomendación
router.post('/segmentation', segmentSpace);

// GET /api/v1/spaces               -> lista (filtros: ?pais= ?tipo=)
router.get('/', getAllSpaces);

// GET /api/v1/spaces/:id           -> detalle por id
router.get('/:id', getSpaceById);

export default router;
