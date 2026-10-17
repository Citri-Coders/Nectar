import { Router } from 'express';
import {
  getMunicipioCatalogo,
  getMunicipioDashboard,
  getMunicipioMapPoints,
} from '../controllers/municipio.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Módulo municipal: requiere sesión (lectura de un módulo protegido).
// GET /api/v1/municipio/catalogo                     -> municipios por país soportado
router.get('/catalogo', requireAuth, getMunicipioCatalogo);

// GET /api/v1/municipio/dashboard/:nombre_municipio   -> KPIs + ranking de comunidades
router.get('/dashboard/:nombre_municipio', requireAuth, getMunicipioDashboard);

// GET /api/v1/municipio/map-points/:nombre_municipio  -> geopuntos para el mapa
router.get('/map-points/:nombre_municipio', requireAuth, getMunicipioMapPoints);

export default router;
