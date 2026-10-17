import { Router } from 'express';
import {
  getPaises,
  getPaisDetalle,
  getMunicipiosDePais,
  getPolinizadoresDeMunicipio,
  getPolinizadores,
  getCatalogo,
} from '../controllers/biodiversidad.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Módulo de biodiversidad: requiere sesión (lectura de un módulo protegido).
router.use(requireAuth);

// GET /api/v1/biodiversidad/paises                       -> países + conteos
router.get('/paises', getPaises);

// GET /api/v1/biodiversidad/pais/:pais                   -> país + municipios + polinizadores
router.get('/pais/:pais', getPaisDetalle);

// GET /api/v1/biodiversidad/paises/:pais/municipios      -> municipios del país
router.get('/paises/:pais/municipios', getMunicipiosDePais);

// GET /api/v1/biodiversidad/municipios/:municipio/polinizadores[?pais=&tipo=]
router.get('/municipios/:municipio/polinizadores', getPolinizadoresDeMunicipio);

// GET /api/v1/biodiversidad/polinizadores[?tipo=&grupo=&pais=&municipio=]
router.get('/polinizadores', getPolinizadores);

// GET /api/v1/biodiversidad/catalogo                     -> jerarquía completa
router.get('/catalogo', getCatalogo);

export default router;
