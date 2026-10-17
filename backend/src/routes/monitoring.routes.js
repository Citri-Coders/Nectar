import { Router } from 'express';
import {
  registerMonitoring,
  getMonitoringBySpace,
} from '../controllers/monitoring.controller.js';

const router = Router();

// POST /api/v1/monitoring                    -> registra un avistamiento (+15 pts)
router.post('/', registerMonitoring);

// GET /api/v1/monitoring/space/:espacio_id   -> historial de un espacio
router.get('/space/:espacio_id', getMonitoringBySpace);

export default router;
