import { Router } from 'express';
import { getLeaderboard } from '../controllers/gamification.controller.js';

const router = Router();

// GET /api/v1/gamification/leaderboard  -> ranking por puntos acumulados
router.get('/leaderboard', getLeaderboard);

export default router;
