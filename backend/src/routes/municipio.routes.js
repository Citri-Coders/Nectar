import { Router } from 'express';
import {
  getMunicipioDashboard,
  getMunicipioMapPoints,
} from '../controllers/municipio.controller.js';

const router = Router();

// GET /api/v1/municipio/dashboard/:nombre_municipio   -> KPIs + ranking de comunidades
router.get('/dashboard/:nombre_municipio', getMunicipioDashboard);

// GET /api/v1/municipio/map-points/:nombre_municipio  -> geopuntos para el mapa
router.get('/map-points/:nombre_municipio', getMunicipioMapPoints);

export default router;
