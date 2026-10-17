import { Router } from 'express';
import speciesData from '../data/speciesData.js';

const router = Router();

// GET /api/v1/species
//  - Sin parámetros: devuelve todos los países.
//  - Con ?pais=Nicaragua: filtra y devuelve solo ese país.
router.get('/', (req, res) => {
  const { pais } = req.query;

  if (!pais) {
    return res.json({
      total: Object.keys(speciesData).length,
      data: Object.values(speciesData),
    });
  }

  const paisBuscado = String(pais).trim().toLowerCase();
  const encontrado = Object.values(speciesData).find(
    (item) => item.pais.toLowerCase() === paisBuscado
  );

  if (!encontrado) {
    return res.status(404).json({
      message: `No se encontraron especies registradas para el país "${pais}".`,
      paises_disponibles: Object.keys(speciesData),
    });
  }

  return res.json({ total: 1, data: [encontrado] });
});

export default router;
