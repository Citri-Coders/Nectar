import { Router } from 'express';
import speciesData from '../data/speciesData.js';
import {
  findCountryKey,
  getSupportedCountries,
} from '../services/recommendation.service.js';

const router = Router();

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

// GET /api/v1/species
//  - Sin parámetros: devuelve todos los países soportados.
//  - Con ?pais=Nicaragua: filtra por país (sin distinguir mayúsculas ni tildes,
//    igual que /spaces y /municipio).
router.get('/', (req, res) => {
  const { pais } = req.query;

  if (isBlank(pais)) {
    return res.json({
      total: getSupportedCountries().length,
      data: Object.values(speciesData),
    });
  }

  // findCountryKey normaliza tildes/mayúsculas/espacios, de modo que tanto
  // "Mexico" como "México" resuelven a la misma clave canónica.
  const paisKey = findCountryKey(pais);

  if (!paisKey) {
    return res.status(404).json({
      message: `No se encontraron especies registradas para el país "${pais}".`,
      paises_disponibles: getSupportedCountries(),
    });
  }

  return res.json({ total: 1, data: [speciesData[paisKey]] });
});

export default router;
