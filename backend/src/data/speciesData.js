// Biodiversidad oficial de Néctar LatAm por país.
// Fuente base: tabla 7.2 "Ejemplo de especies nativas por país".
//
// Cada país incluye:
//   - abejasSinAguijon: meliponas y trigonas (manejables en cajas racionales).
//   - abejasSolitarias: abejas nativas de gran tamaño (Xylocopa, Centris).
//   - plantasNativas:   lista de nombres (compatibilidad con /api/v1/species).
//   - catalogoPlantas:  detalle de cada planta con sus pisos climáticos aptos.
//
// Pisos climáticos válidos: calido_seco | calido_humedo | templado | frio

function pais({ nombre, abejasSinAguijon, abejasSolitarias, catalogoPlantas }) {
  return {
    pais: nombre,
    abejasSinAguijon,
    abejasSolitarias,
    plantasNativas: catalogoPlantas.map((planta) => planta.nombre),
    catalogoPlantas,
  };
}

export const speciesData = {
  Nicaragua: pais({
    nombre: 'Nicaragua',
    abejasSinAguijon: ['Melipona beecheii', 'Trigona fulviventris'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Madero negro',    climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Sacuanjoche',     climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Flor de izote',   climas: ['calido_seco', 'templado'] },
      { nombre: 'Achiote',         climas: ['calido_humedo', 'templado'] },
      { nombre: 'Jocote',          climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Ojoche',          climas: ['calido_humedo'] },
      { nombre: 'Coyol',           climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Tigüilote',       climas: ['calido_seco', 'templado'] },
    ],
  }),

  Colombia: pais({
    nombre: 'Colombia',
    abejasSinAguijon: ['Melipona compressipes', 'Tetragonisca angustula'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Guayacán',        climas: ['calido_seco', 'templado'] },
      { nombre: 'Carbonero',       climas: ['templado', 'frio'] },
      { nombre: 'Chicalá',         climas: ['calido_seco', 'templado'] },
      { nombre: 'Nacedero',        climas: ['calido_humedo', 'templado'] },
      { nombre: 'Arrayán',         climas: ['templado', 'frio'] },
      { nombre: 'Encenillo',       climas: ['frio'] },
      { nombre: 'Balso',           climas: ['calido_humedo', 'templado'] },
      { nombre: 'Roble',           climas: ['templado', 'frio'] },
    ],
  }),

  Perú: pais({
    nombre: 'Perú',
    abejasSinAguijon: ['Melipona rufiventris', 'Scaptotrigona'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Molle',           climas: ['calido_seco', 'templado'] },
      { nombre: 'Huaranhuay',      climas: ['calido_seco', 'templado'] },
      { nombre: 'Tara',            climas: ['calido_seco', 'templado'] },
      { nombre: 'Mutuy',           climas: ['calido_seco', 'templado'] },
      { nombre: 'Llaulli',         climas: ['templado', 'frio'] },
      { nombre: 'Chachacomo',      climas: ['templado', 'frio'] },
      { nombre: 'Cantuta',         climas: ['templado', 'frio'] },
      { nombre: 'Quishuar',        climas: ['templado', 'frio'] },
    ],
  }),

  Brasil: pais({
    nombre: 'Brasil',
    abejasSinAguijon: ['Melipona quadrifasciata', 'Tetragonisca'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Ipê',             climas: ['calido_seco', 'templado'] },
      { nombre: 'Aroeira',         climas: ['calido_humedo', 'templado'] },
      { nombre: 'Jacarandá',       climas: ['templado'] },
      { nombre: 'Angico',          climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Canafístula',     climas: ['calido_humedo', 'templado'] },
      { nombre: 'Sibipiruna',      climas: ['calido_humedo', 'templado'] },
      { nombre: 'Açaí',            climas: ['calido_humedo'] },
      { nombre: 'Cajueiro',        climas: ['calido_seco', 'calido_humedo'] },
    ],
  }),
};

export default speciesData;
