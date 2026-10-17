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

export default app;
