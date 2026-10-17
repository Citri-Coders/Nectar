// ============================================================================
// Punto de entrada para Vercel.
// ----------------------------------------------------------------------------
// Vercel detecta automáticamente una aplicación Express cuando uno de los
// archivos reconocidos (app.js / index.js / server.js, en la raíz o dentro de
// src/) importa `express` y exporta la instancia como export por defecto.
//
// Aquí no duplicamos la app: reexportamos la que ya vive en el backend. La API
// queda disponible en las mismas rutas (/api/v1/...) y la SPA (frontend) se
// sirve como sitio estático desde public/ (ver vercel.json y scripts/).
// ============================================================================

import express from 'express';

import app from './backend/src/app.js';

// El import de `express` es necesario para que el detector de frameworks de
// Vercel reconozca este archivo como el backend. Se reexporta para no dejarlo
// sin usar.
export { express };

export default app;
