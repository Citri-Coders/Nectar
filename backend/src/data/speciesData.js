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

  Argentina: pais({
    nombre: 'Argentina',
    abejasSinAguijon: ['Tetragonisca fiebrigi', 'Scaptotrigona jujuyensis'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Lapacho',         climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Ceibo',           climas: ['calido_humedo', 'templado'] },
      { nombre: 'Jacarandá',       climas: ['templado'] },
      { nombre: 'Espinillo',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Algarrobo',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Tala',            climas: ['calido_seco', 'templado'] },
      { nombre: 'Mistol',          climas: ['calido_seco'] },
      { nombre: 'Churqui',         climas: ['calido_seco', 'templado', 'frio'] },
    ],
  }),

  Bolivia: pais({
    nombre: 'Bolivia',
    abejasSinAguijon: ['Tetragonisca angustula', 'Melipona rufiventris'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Lapacho',         climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Jacarandá',       climas: ['templado'] },
      { nombre: 'Ceibo',           climas: ['calido_humedo', 'templado'] },
      { nombre: 'Algarrobo',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Molle',           climas: ['calido_seco', 'templado'] },
      { nombre: 'Tara',            climas: ['calido_seco', 'templado'] },
      { nombre: 'Cantuta',         climas: ['templado', 'frio'] },
      { nombre: 'Chachacomo',      climas: ['templado', 'frio'] },
    ],
  }),

  Chile: pais({
    nombre: 'Chile',
    // Chile no tiene meliponas nativas: se prioriza la abeja nativa social Manuelia
    // y las solitarias de gran tamaño del matorral y el norte árido.
    abejasSinAguijon: ['Manuelia postica', 'Manuelia gayi'],
    abejasSolitarias: ['Centris', 'Colletes'],
    catalogoPlantas: [
      { nombre: 'Quillay',         climas: ['calido_seco', 'templado'] },
      { nombre: 'Peumo',           climas: ['calido_seco', 'templado'] },
      { nombre: 'Boldo',           climas: ['calido_seco', 'templado'] },
      { nombre: 'Arrayán',         climas: ['calido_humedo', 'templado'] },
      { nombre: 'Maitén',          climas: ['templado', 'frio'] },
      { nombre: 'Espino',          climas: ['calido_seco', 'templado'] },
      { nombre: 'Algarrobo',       climas: ['calido_seco'] },
      { nombre: 'Chañar',          climas: ['calido_seco'] },
    ],
  }),

  'Costa Rica': pais({
    nombre: 'Costa Rica',
    abejasSinAguijon: ['Melipona beecheii', 'Tetragonisca angustula'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Poró',            climas: ['calido_humedo', 'templado'] },
      { nombre: 'Guayacán real',   climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Cortés blanco',   climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Roble sabana',    climas: ['calido_humedo', 'templado'] },
      { nombre: 'Malinche',        climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Itabo',           climas: ['calido_humedo', 'templado'] },
      { nombre: 'Vainillo',        climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Güitite',         climas: ['calido_seco', 'calido_humedo', 'templado'] },
    ],
  }),

  'El Salvador': pais({
    nombre: 'El Salvador',
    abejasSinAguijon: ['Melipona beecheii', 'Trigona fulviventris'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Maquilishuat',    climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Flor de izote',   climas: ['calido_seco', 'templado'] },
      { nombre: 'Madrecacao',      climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Bálsamo',         climas: ['calido_humedo', 'templado'] },
      { nombre: 'Cortés blanco',   climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Conacaste',       climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Cenícero',        climas: ['calido_seco'] },
      { nombre: 'Chichipate',      climas: ['calido_seco', 'calido_humedo'] },
    ],
  }),

  México: pais({
    nombre: 'México',
    abejasSinAguijon: ['Melipona beecheii', 'Scaptotrigona pectoralis'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Guayacán',        climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Primavera',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Colorín',         climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Cazahuate',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Árbol de las manitas', climas: ['templado', 'frio'] },
      { nombre: 'Jacarandá',       climas: ['templado'] },
      { nombre: 'Tepehuaje',       climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Pata de vaca',    climas: ['calido_seco', 'calido_humedo'] },
    ],
  }),

  Paraguay: pais({
    nombre: 'Paraguay',
    abejasSinAguijon: ['Tetragonisca fiebrigi', 'Scaptotrigona'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Lapacho',         climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Yvyra pytã',      climas: ['calido_humedo', 'templado'] },
      { nombre: 'Jacarandá',       climas: ['templado'] },
      { nombre: 'Ceibo',           climas: ['calido_humedo', 'templado'] },
      { nombre: 'Algarrobo',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Guayabo',         climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Tala',            climas: ['calido_seco', 'templado'] },
      { nombre: 'Sauce criollo',   climas: ['calido_humedo', 'templado'] },
    ],
  }),

  Venezuela: pais({
    nombre: 'Venezuela',
    abejasSinAguijon: ['Melipona favosa', 'Tetragonisca angustula'],
    abejasSolitarias: ['Xylocopa', 'Centris'],
    catalogoPlantas: [
      { nombre: 'Araguaney',       climas: ['calido_seco', 'templado'] },
      { nombre: 'Bucare',          climas: ['calido_seco', 'calido_humedo', 'templado'] },
      { nombre: 'Guayacán',        climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Jabillo',         climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Apamate',         climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Samán',           climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Cayena',          climas: ['calido_seco', 'calido_humedo'] },
      { nombre: 'Trinitaria',      climas: ['calido_seco', 'calido_humedo'] },
    ],
  }),
};

export default speciesData;
