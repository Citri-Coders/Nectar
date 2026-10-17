import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import speciesRoutes from './routes/species.routes.js';
import spacesRoutes from './routes/spaces.routes.js';
import monitoringRoutes from './routes/monitoring.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import municipioRoutes from './routes/municipio.routes.js';
import sealRoutes from './routes/seal.routes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ruta de prueba (health check)
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Néctar LatAm activa' });
});

// Rutas de especies nativas
app.use('/api/v1/species', speciesRoutes);

// Rutas de espacios registrados
app.use('/api/v1/spaces', spacesRoutes);

// Rutas de monitoreo de campo
app.use('/api/v1/monitoring', monitoringRoutes);

// Rutas de gamificación (ranking)
app.use('/api/v1/gamification', gamificationRoutes);

// Rutas del módulo municipal (dashboard + mapa)
app.use('/api/v1/municipio', municipioRoutes);

// Rutas del Sello "Polinizador Amigo" (trazabilidad QR + adopciones)
app.use('/api/v1/seal', sealRoutes);

// Índice de la API: ayuda a descubrir los endpoints disponibles.
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'Néctar LatAm API',
    version: 'v1',
    endpoints: [
      'GET  /api/v1/health',
      'GET  /api/v1/species[?pais=]',
      'GET  /api/v1/spaces[?pais=&tipo=]',
      'POST /api/v1/spaces/segmentation',
      'GET  /api/v1/spaces/:id',
      'POST /api/v1/monitoring',
      'GET  /api/v1/monitoring/space/:espacio_id',
      'GET  /api/v1/gamification/leaderboard',
      'GET  /api/v1/municipio/catalogo',
      'GET  /api/v1/municipio/dashboard/:nombre_municipio[?pais=]',
      'GET  /api/v1/municipio/map-points/:nombre_municipio[?pais=]',
      'GET  /api/v1/seal/producers',
      'GET  /api/v1/seal/verify/:id_o_slug',
      'POST /api/v1/seal/adopt',
    ],
  });
});

// 404 en JSON para cualquier endpoint desconocido: evita que el cliente reciba
// HTML y no pueda interpretar el error.
app.use((req, res) => {
  res.status(404).json({
    message: `No existe el endpoint "${req.method} ${req.originalUrl}".`,
    api_index: '/api/v1',
  });
});

// Manejador de errores centralizado: cualquier excepción no controlada
// responde siempre en JSON (y no con el HTML por defecto de Express).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = Number(err?.status) || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    message: err?.message || 'Error interno del servidor.',
  });
});

export default app;
