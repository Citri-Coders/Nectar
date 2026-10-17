import { Router } from 'express';
import {
  deleteMonitoring,
  getMonitoringBySpace,
  registerMonitoring,
} from '../controllers/monitoring.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/monitoring                    -> registra un avistamiento (+15 pts)
// Requiere sesión (usuario o administrador; el auditor solo consulta).
router.post('/', requireAuth, requireRole('usuario', 'administrador'), registerMonitoring);

// GET /api/v1/monitoring/space/:espacio_id   -> historial de un espacio
router.get('/space/:espacio_id', requireAuth, getMonitoringBySpace);

// DELETE /api/v1/monitoring/:id              -> elimina un avistamiento (solo administrador)
router.delete('/:id', requireAuth, requireRole('administrador'), deleteMonitoring);

export default router;
