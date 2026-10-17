-- ============================================================================
-- Néctar LatAm — Datos semilla de la base de datos de polinizadores
-- ----------------------------------------------------------------------------
-- Fuente de los países y las abejas: backend/src/data/speciesData.js
-- Nombres comunes de las abejas:   backend/src/data/sealData.js
-- Centros geográficos:             frontend/src/lib/catalog.ts (PAIS_CENTROS)
-- Pisos climáticos:                frontend/src/lib/catalog.ts (PISOS_CLIMATICOS)
--
-- El script es idempotente (INSERT OR IGNORE + claves naturales únicas), por
-- lo que puede ejecutarse más de una vez sin duplicar registros.
--
-- Los municipios son una lista curada: capitales de departamento/estado/provincia
-- y municipios representativos (cafetaleros, costeros, andinos) de cada país, con
-- su `piso_climatico`, que es lo que gobierna qué polinizadores del catálogo
-- nacional están presentes en el municipio y con qué abundancia.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. PAÍSES (los 11 del proyecto)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO paises (nombre, nombre_normalizado, codigo, centro_lat, centro_lng, zoom) VALUES
  ('Nicaragua',   'nicaragua',   'NIC', 12.87,  -85.21,  7),
  ('Colombia',    'colombia',    'COL',  4.57,  -74.30,  6),
  ('Brasil',      'brasil',      'BRA', -14.24, -51.93,  4),
  ('Argentina',   'argentina',   'ARG', -38.42, -63.62,  4),
  ('Bolivia',     'bolivia',     'BOL', -16.29, -63.59,  6),
  ('Chile',       'chile',       'CHL', -35.68, -71.54,  5),
  ('Costa Rica',  'costa rica',  'CRI',  9.75,  -83.75,  8),
  ('El Salvador', 'el salvador', 'SLV', 13.79,  -88.90,  9),
  ('México',      'mexico',      'MEX', 23.63, -102.55,  5),
  ('Paraguay',    'paraguay',    'PRY', -23.44, -58.44,  6),
  ('Venezuela',   'venezuela',   'VEN',  6.42,  -66.59,  6);

-- ----------------------------------------------------------------------------
-- 2. MUNICIPIOS  (~141: lista curada por país)
--    Columnas de cada fila: (país, municipio, normalizado, departamento,
--    piso_climatico, latitud, longitud)
--    - Matagalpa (Nicaragua) y Pitalito (Colombia) son los municipios reales
--      del proyecto; el resto completa el mapa municipal de cada país.
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO municipios (pais_id, nombre, nombre_normalizado, departamento, piso_climatico, lat, lng)
SELECT p.id, v.column2, v.column3, v.column4, v.column5, v.column6, v.column7
FROM (VALUES
  -- Nicaragua (13)
  ('Nicaragua', 'Managua',                    'managua',                    'Managua',               'calido_seco',   12.1328,  -86.2504),
  ('Nicaragua', 'León',                       'leon',                       'León',                  'calido_seco',   12.4348,  -86.8780),
  ('Nicaragua', 'Chinandega',                 'chinandega',                 'Chinandega',            'calido_seco',   12.6290,  -87.1310),
  ('Nicaragua', 'Estelí',                     'esteli',                     'Estelí',                'templado',      13.0919,  -86.3537),
  ('Nicaragua', 'Matagalpa',                  'matagalpa',                  'Matagalpa',             'templado',      12.9255,  -85.9178),
  ('Nicaragua', 'Jinotega',                   'jinotega',                   'Jinotega',              'templado',      13.0915,  -86.0016),
  ('Nicaragua', 'Masaya',                     'masaya',                     'Masaya',                'calido_seco',   11.9744,  -86.0942),
  ('Nicaragua', 'Granada',                    'granada',                    'Granada',               'calido_seco',   11.9299,  -85.9560),
  ('Nicaragua', 'Rivas',                      'rivas',                      'Rivas',                 'calido_seco',   11.4372,  -85.8265),
  ('Nicaragua', 'Juigalpa',                   'juigalpa',                   'Chontales',             'calido_humedo', 12.1063,  -85.3645),
  ('Nicaragua', 'Ocotal',                     'ocotal',                     'Nueva Segovia',         'templado',      13.6322,  -86.4752),
  ('Nicaragua', 'Puerto Cabezas',             'puerto cabezas',             'Costa Caribe Norte',    'calido_humedo', 14.0351,  -83.3860),
  ('Nicaragua', 'Bluefields',                 'bluefields',                 'Costa Caribe Sur',      'calido_humedo', 12.0137,  -83.7643),

  -- Colombia (14)
  ('Colombia',  'Bogotá',                     'bogota',                     'Bogotá D.C.',           'frio',           4.7110,  -74.0721),
  ('Colombia',  'Medellín',                   'medellin',                   'Antioquia',             'templado',       6.2442,  -75.5812),
  ('Colombia',  'Cali',                       'cali',                       'Valle del Cauca',       'calido_seco',    3.4516,  -76.5320),
  ('Colombia',  'Manizales',                  'manizales',                  'Caldas',                'templado',       5.0703,  -75.5138),
  ('Colombia',  'Pereira',                    'pereira',                    'Risaralda',             'templado',       4.8143,  -75.6946),
  ('Colombia',  'Armenia',                    'armenia',                    'Quindío',               'templado',       4.5339,  -75.6811),
  ('Colombia',  'Ibagué',                     'ibague',                     'Tolima',                'templado',       4.4389,  -75.2322),
  ('Colombia',  'Neiva',                      'neiva',                      'Huila',                 'calido_seco',    2.9345,  -75.2809),
  ('Colombia',  'Pitalito',                   'pitalito',                   'Huila',                 'templado',       1.8535,  -76.0504),
  ('Colombia',  'Florencia',                  'florencia',                  'Caquetá',               'calido_humedo',  1.6144,  -75.6062),
  ('Colombia',  'Villavicencio',              'villavicencio',              'Meta',                  'calido_humedo',  4.1420,  -73.6266),
  ('Colombia',  'Bucaramanga',                'bucaramanga',                'Santander',             'templado',       7.1193,  -73.1227),
  ('Colombia',  'Santa Marta',                'santa marta',                'Magdalena',             'calido_seco',   11.2404,  -74.1990),
  ('Colombia',  'Leticia',                    'leticia',                    'Amazonas',              'calido_humedo', -4.2153,  -69.9406),

  -- Brasil (14)
  ('Brasil',    'São Paulo',                  'sao paulo',                  'São Paulo',             'templado',     -23.5505,  -46.6333),
  ('Brasil',    'Rio de Janeiro',             'rio de janeiro',             'Rio de Janeiro',        'calido_humedo',-22.9068,  -43.1729),
  ('Brasil',    'Belo Horizonte',             'belo horizonte',             'Minas Gerais',          'templado',     -19.9167,  -43.9345),
  ('Brasil',    'Curitiba',                   'curitiba',                   'Paraná',                'templado',     -25.4284,  -49.2733),
  ('Brasil',    'Porto Alegre',               'porto alegre',               'Rio Grande do Sul',     'templado',     -30.0346,  -51.2177),
  ('Brasil',    'Salvador',                   'salvador',                   'Bahía',                 'calido_humedo',-12.9777,  -38.5016),
  ('Brasil',    'Recife',                     'recife',                     'Pernambuco',            'calido_humedo', -8.0476,  -34.8770),
  ('Brasil',    'Fortaleza',                  'fortaleza',                  'Ceará',                 'calido_seco',   -3.7319,  -38.5267),
  ('Brasil',    'Belém',                      'belem',                      'Pará',                  'calido_humedo', -1.4558,  -48.4902),
  ('Brasil',    'Manaus',                     'manaus',                     'Amazonas',              'calido_humedo', -3.1190,  -60.0217),
  ('Brasil',    'Goiânia',                    'goiania',                    'Goiás',                 'calido_seco',  -16.6869,  -49.2648),
  ('Brasil',    'Ribeirão Preto',             'ribeirao preto',             'São Paulo',             'calido_seco',  -21.1704,  -47.8103),
  ('Brasil',    'Londrina',                   'londrina',                   'Paraná',                'templado',     -23.3045,  -51.1696),
  ('Brasil',    'Vitória da Conquista',       'vitoria da conquista',       'Bahía',                 'calido_seco',  -14.8615,  -40.8442),

  -- Argentina (15)
  ('Argentina', 'Ciudad Autónoma de Buenos Aires', 'ciudad autonoma de buenos aires', 'Buenos Aires',   'templado',     -34.6037,  -58.3816),
  ('Argentina', 'Córdoba',                    'cordoba',                    'Córdoba',               'templado',     -31.4201,  -64.1888),
  ('Argentina', 'Rosario',                    'rosario',                    'Santa Fe',              'templado',     -32.9442,  -60.6505),
  ('Argentina', 'Mendoza',                    'mendoza',                    'Mendoza',               'calido_seco',  -32.8908,  -68.8272),
  ('Argentina', 'San Miguel de Tucumán',      'san miguel de tucuman',      'Tucumán',               'calido_humedo',-26.8083,  -65.2176),
  ('Argentina', 'Salta',                      'salta',                      'Salta',                 'templado',     -24.7821,  -65.4232),
  ('Argentina', 'Posadas',                    'posadas',                    'Misiones',              'calido_humedo',-27.3621,  -55.9007),
  ('Argentina', 'San Carlos de Bariloche',    'san carlos de bariloche',    'Río Negro',             'frio',         -41.1335,  -71.3103),
  ('Argentina', 'Neuquén',                    'neuquen',                    'Neuquén',               'calido_seco',  -38.9516,  -68.0591),
  ('Argentina', 'Bahía Blanca',               'bahia blanca',               'Buenos Aires',          'templado',     -38.7183,  -62.2663),
  ('Argentina', 'La Plata',                   'la plata',                   'Buenos Aires',          'templado',     -34.9215,  -57.9545),
  ('Argentina', 'Corrientes',                 'corrientes',                 'Corrientes',            'calido_humedo',-27.4692,  -58.8306),
  ('Argentina', 'San Salvador de Jujuy',      'san salvador de jujuy',      'Jujuy',                 'templado',     -24.1858,  -65.2995),
  ('Argentina', 'Santiago del Estero',        'santiago del estero',        'Santiago del Estero',   'calido_seco',  -27.7951,  -64.2615),
  ('Argentina', 'Puerto Iguazú',              'puerto iguazu',              'Misiones',              'calido_humedo',-25.5994,  -54.5731),

  -- Bolivia (11)
  ('Bolivia',   'La Paz',                     'la paz',                     'La Paz',                'frio',         -16.5000,  -68.1500),
  ('Bolivia',   'Santa Cruz de la Sierra',    'santa cruz de la sierra',    'Santa Cruz',            'calido_humedo',-17.7833,  -63.1821),
  ('Bolivia',   'Sucre',                      'sucre',                      'Chuquisaca',            'templado',     -19.0333,  -65.2627),
  ('Bolivia',   'Cochabamba',                 'cochabamba',                 'Cochabamba',            'templado',     -17.3895,  -66.1568),
  ('Bolivia',   'Oruro',                      'oruro',                      'Oruro',                 'frio',         -17.9833,  -67.1500),
  ('Bolivia',   'Potosí',                     'potosi',                     'Potosí',                'frio',         -19.5836,  -65.7531),
  ('Bolivia',   'Tarija',                     'tarija',                     'Tarija',                'templado',     -21.5355,  -64.7296),
  ('Bolivia',   'Trinidad',                   'trinidad',                   'Beni',                  'calido_humedo',-14.8333,  -64.9000),
  ('Bolivia',   'Cobija',                     'cobija',                     'Pando',                 'calido_humedo',-11.0267,  -68.7694),
  ('Bolivia',   'Riberalta',                  'riberalta',                  'Beni',                  'calido_humedo',-11.0068,  -66.0633),
  ('Bolivia',   'Villazón',                   'villazon',                   'Potosí',                'frio',         -22.0864,  -65.5942),

  -- Chile (13)
  ('Chile',     'Santiago',                   'santiago',                   'Región Metropolitana',  'templado',     -33.4489,  -70.6693),
  ('Chile',     'Valparaíso',                 'valparaiso',                 'Valparaíso',            'templado',     -33.0472,  -71.6127),
  ('Chile',     'Viña del Mar',               'vina del mar',               'Valparaíso',            'templado',     -33.0245,  -71.5518),
  ('Chile',     'Concepción',                 'concepcion',                 'Biobío',                'templado',     -36.8201,  -73.0444),
  ('Chile',     'La Serena',                  'la serena',                  'Coquimbo',              'calido_seco',  -29.9027,  -71.2519),
  ('Chile',     'Antofagasta',                'antofagasta',                'Antofagasta',           'calido_seco',  -23.6509,  -70.3975),
  ('Chile',     'Arica',                      'arica',                      'Arica y Parinacota',    'calido_seco',  -18.4783,  -70.3126),
  ('Chile',     'Temuco',                     'temuco',                     'La Araucanía',          'templado',     -38.7359,  -72.5904),
  ('Chile',     'Chillán',                    'chillan',                    'Ñuble',                 'templado',     -36.6066,  -72.1034),
  ('Chile',     'Talca',                      'talca',                      'Maule',                 'templado',     -35.4264,  -71.6554),
  ('Chile',     'Rancagua',                   'rancagua',                   'O''Higgins',            'templado',     -34.1708,  -70.7444),
  ('Chile',     'Puerto Montt',               'puerto montt',               'Los Lagos',             'templado',     -41.4693,  -72.9424),
  ('Chile',     'Punta Arenas',               'punta arenas',               'Magallanes',            'frio',         -53.1638,  -70.9171),

  -- Costa Rica (10)
  ('Costa Rica','San José',                   'san jose',                   'San José',              'templado',       9.9281,  -84.0907),
  ('Costa Rica','Alajuela',                   'alajuela',                   'Alajuela',              'templado',      10.0162,  -84.2116),
  ('Costa Rica','Cartago',                    'cartago',                    'Cartago',               'templado',       9.8644,  -83.9194),
  ('Costa Rica','Heredia',                    'heredia',                    'Heredia',               'templado',      10.0024,  -84.1165),
  ('Costa Rica','Liberia',                    'liberia',                    'Guanacaste',            'calido_seco',   10.6344,  -85.4407),
  ('Costa Rica','Nicoya',                     'nicoya',                     'Guanacaste',            'calido_seco',   10.1483,  -85.4520),
  ('Costa Rica','Puntarenas',                 'puntarenas',                 'Puntarenas',            'calido_humedo',  9.9763,  -84.8384),
  ('Costa Rica','Limón',                      'limon',                      'Limón',                 'calido_humedo',  9.9907,  -83.0351),
  ('Costa Rica','Pérez Zeledón',              'perez zeledon',              'San José',              'templado',       9.3792,  -83.6662),
  ('Costa Rica','Upala',                      'upala',                      'Alajuela',              'calido_humedo', 10.8978,  -85.0153),

  -- El Salvador (13)
  ('El Salvador','San Salvador',              'san salvador',               'San Salvador',          'templado',      13.6929,  -89.2182),
  ('El Salvador','Santa Ana',                 'santa ana',                  'Santa Ana',             'templado',      13.9942,  -89.5597),
  ('El Salvador','San Miguel',                'san miguel',                 'San Miguel',            'calido_seco',   13.4833,  -88.1833),
  ('El Salvador','Soyapango',                 'soyapango',                  'San Salvador',          'templado',      13.7104,  -89.1399),
  ('El Salvador','Apopa',                     'apopa',                      'San Salvador',          'templado',      13.8018,  -89.1792),
  ('El Salvador','Mejicanos',                 'mejicanos',                  'San Salvador',          'templado',      13.7239,  -89.2131),
  ('El Salvador','Santa Tecla',               'santa tecla',                'La Libertad',           'templado',      13.6769,  -89.2796),
  ('El Salvador','Ilopango',                  'ilopango',                   'San Salvador',          'templado',      13.7069,  -89.1078),
  ('El Salvador','Zacatecoluca',              'zacatecoluca',               'La Paz',                'calido_seco',   13.5086,  -88.8694),
  ('El Salvador','Usulután',                  'usulutan',                   'Usulután',              'calido_seco',   13.3500,  -88.4500),
  ('El Salvador','San Vicente',               'san vicente',                'San Vicente',           'calido_seco',   13.6413,  -88.7853),
  ('El Salvador','Ahuachapán',                'ahuachapan',                 'Ahuachapán',            'templado',      13.9214,  -89.8450),
  ('El Salvador','Chalatenango',              'chalatenango',               'Chalatenango',          'templado',      14.0333,  -88.9333),

  -- México (15)
  ('México',    'Ciudad de México',           'ciudad de mexico',           'Ciudad de México',      'templado',      19.4326,  -99.1332),
  ('México',    'Guadalajara',                'guadalajara',                'Jalisco',               'templado',      20.6597, -103.3496),
  ('México',    'Monterrey',                  'monterrey',                  'Nuevo León',            'calido_seco',   25.6866, -100.3161),
  ('México',    'Puebla',                     'puebla',                     'Puebla',                'templado',      19.0414,  -98.2063),
  ('México',    'Querétaro',                  'queretaro',                  'Querétaro',             'templado',      20.5888, -100.3899),
  ('México',    'Mérida',                     'merida',                     'Yucatán',               'calido_seco',   20.9674,  -89.5926),
  ('México',    'Oaxaca de Juárez',           'oaxaca de juarez',           'Oaxaca',                'templado',      17.0732,  -96.7266),
  ('México',    'Cuernavaca',                 'cuernavaca',                 'Morelos',               'templado',      18.9242,  -99.2216),
  ('México',    'Morelia',                    'morelia',                    'Michoacán',             'templado',      19.7060, -101.1950),
  ('México',    'León',                       'leon',                       'Guanajuato',            'templado',      21.1221, -101.6836),
  ('México',    'Xalapa',                     'xalapa',                     'Veracruz',              'templado',      19.5438,  -96.9102),
  ('México',    'Villahermosa',               'villahermosa',               'Tabasco',               'calido_humedo', 17.9892,  -92.9475),
  ('México',    'San Cristóbal de las Casas', 'san cristobal de las casas', 'Chiapas',               'templado',      16.7370,  -92.6376),
  ('México',    'Tapachula',                  'tapachula',                  'Chiapas',               'calido_humedo', 14.9059,  -92.2634),
  ('México',    'Tijuana',                    'tijuana',                    'Baja California',       'calido_seco',   32.5149, -117.0382),

  -- Paraguay (10)
  ('Paraguay',  'Asunción',                   'asuncion',                   'Asunción',              'calido_humedo',-25.2637,  -57.5759),
  ('Paraguay',  'Ciudad del Este',            'ciudad del este',            'Alto Paraná',           'calido_humedo',-25.5097,  -54.6111),
  ('Paraguay',  'Encarnación',                'encarnacion',                'Itapúa',                'calido_humedo',-27.3351,  -55.8743),
  ('Paraguay',  'Luque',                      'luque',                      'Central',               'calido_humedo',-25.2700,  -57.4870),
  ('Paraguay',  'San Lorenzo',                'san lorenzo',                'Central',               'calido_humedo',-25.3397,  -57.5089),
  ('Paraguay',  'Caacupé',                    'caacupe',                    'Cordillera',            'calido_humedo',-25.3861,  -57.1408),
  ('Paraguay',  'Concepción',                 'concepcion',                 'Concepción',            'calido_humedo',-23.4064,  -57.4344),
  ('Paraguay',  'Pedro Juan Caballero',       'pedro juan caballero',       'Amambay',               'calido_humedo',-22.5492,  -55.7331),
  ('Paraguay',  'Filadelfia',                 'filadelfia',                 'Boquerón',              'calido_seco',  -22.3500,  -60.0333),
  ('Paraguay',  'Pilar',                      'pilar',                      'Ñeembucú',              'calido_humedo',-26.8539,  -58.3028),

  -- Venezuela (13)
  ('Venezuela', 'Caracas',                    'caracas',                    'Distrito Capital',      'templado',      10.4806,  -66.9036),
  ('Venezuela', 'Maracaibo',                  'maracaibo',                  'Zulia',                 'calido_seco',   10.6666,  -71.6124),
  ('Venezuela', 'Valencia',                   'valencia',                   'Carabobo',              'calido_seco',   10.1620,  -68.0077),
  ('Venezuela', 'Barquisimeto',               'barquisimeto',               'Lara',                  'calido_seco',   10.0678,  -69.3474),
  ('Venezuela', 'Maracay',                    'maracay',                    'Aragua',                'calido_seco',   10.2469,  -67.5958),
  ('Venezuela', 'Mérida',                     'merida',                     'Mérida',                'templado',       8.5897,  -71.1561),
  ('Venezuela', 'San Cristóbal',              'san cristobal',              'Táchira',               'templado',       7.7669,  -72.2250),
  ('Venezuela', 'Barinas',                    'barinas',                    'Barinas',               'calido_seco',    8.6226,  -70.2075),
  ('Venezuela', 'Ciudad Bolívar',             'ciudad bolivar',             'Bolívar',               'calido_humedo',  8.1222,  -63.5497),
  ('Venezuela', 'Puerto Ayacucho',            'puerto ayacucho',            'Amazonas',              'calido_humedo',  5.6639,  -67.6236),
  ('Venezuela', 'Ciudad Guayana',             'ciudad guayana',             'Bolívar',               'calido_humedo',  8.3533,  -62.6528),
  ('Venezuela', 'Coro',                       'coro',                       'Falcón',                'calido_seco',   11.4045,  -69.6737),
  ('Venezuela', 'Cumaná',                     'cumana',                     'Sucre',                 'calido_seco',   10.4531,  -64.1826)
) AS v
JOIN paises p ON p.nombre = v.column1;

-- ----------------------------------------------------------------------------
-- 3. POLINIZADORES
--    Aves  = colibríes nectarívoros de cada país.
--    Abejas = nativas del proyecto (meliponas/trigonas y solitarias).
--    Mamíferos = murciélagos nectarívoros (y mamíferos del matorral en Chile).
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO polinizadores (nombre_cientifico, nombre_comun, tipo, grupo, descripcion) VALUES
  -- Abejas sin aguijón (meliponas y trigonas)
  ('Melipona beecheii',        'Abeja Chupapié',              'abeja', 'sin_aguijon', 'Melipona nativa de Mesoamérica, manejable en cajas racionales.'),
  ('Trigona fulviventris',     'Abeja Jicote',                'abeja', 'sin_aguijon', 'Trigona generalista y agresiva, polinizadora de cultivos y floraciones silvestres.'),
  ('Melipona compressipes',    'Abeja Jandaíra',              'abeja', 'sin_aguijon', 'Melipona de tierras bajas, muy usada en meliponicultura.'),
  ('Tetragonisca angustula',   'Abeja Angelita',              'abeja', 'sin_aguijon', 'Abeja pequeña y dócil, excelente polinizadora de cafetales y huertos.'),
  ('Melipona quadrifasciata',  'Abeja Mandaçaia',             'abeja', 'sin_aguijon', 'Melipona del sureste de Brasil, de gran valor en polinización agrícola.'),
  ('Tetragonisca',             'Abeja Jataí',                 'abeja', 'sin_aguijon', 'Género de abejas sin aguijón ampliamente distribuido en Brasil.'),
  ('Melipona favosa',          'Abeja Favosa',                'abeja', 'sin_aguijon', 'Melipona nativa de Venezuela y el Caribe.'),
  ('Melipona rufiventris',     'Abeja Uruçu',                 'abeja', 'sin_aguijon', 'Melipona de la Amazonía y los valles bolivianos.'),
  ('Manuelia postica',         'Abeja Manuelia',              'abeja', 'sin_aguijon', 'Abeja nativa social de Chile, sin aguijón funcional.'),
  ('Manuelia gayi',            'Abeja Manuelia de Gay',       'abeja', 'sin_aguijon', 'Abeja nativa del matorral chileno.'),
  ('Tetragonisca fiebrigi',    'Abeja Jataí del Sur',         'abeja', 'sin_aguijon', 'Abeja sin aguijón del Cono Sur.'),
  ('Scaptotrigona jujuyensis', 'Abeja Culo de Vaca',          'abeja', 'sin_aguijon', 'Scaptotrigona del noroeste argentino.'),
  ('Scaptotrigona pectoralis', 'Abeja Culo de Vaca',          'abeja', 'sin_aguijon', 'Scaptotrigona mexicana, importante en cafetales de sombra.'),
  ('Scaptotrigona',            'Abeja Culo de Vaca',          'abeja', 'sin_aguijon', 'Género de abejas sin aguijón presente en Paraguay.'),
  -- Abejas solitarias de gran tamaño
  ('Xylocopa',                 'Abeja Carpintera',            'abeja', 'solitarias', 'Abeja grande que poliniza por vibración; nidifica en madera muerta.'),
  ('Centris',                  'Abeja Solitaria del Aceite',  'abeja', 'solitarias', 'Abeja solitaria clave en cultivos como el tomate y los frutales.'),
  ('Colletes',                 'Abeja Colletes',              'abeja', 'solitarias', 'Abeja solitaria del matorral y las zonas áridas de Chile.'),
  -- Aves (colibríes)
  ('Anthracothorax nigricollis','Colibrí Garganta Negra',     'ave',   'ave_nectarivora', 'Colibrí de tierras bajas y jardines tropicales.'),
  ('Amazilia saucerottei',     'Amazilia Coliazul',           'ave',   'ave_nectarivora', 'Colibrí común en jardines y cafetales de Nicaragua.'),
  ('Coeligena torquata',       'Inca Collarejo',              'ave',   'ave_nectarivora', 'Colibrí andino de bosques húmedos y bordes de cafetal.'),
  ('Heliangelus strophianus',  'Colibrí Gargantilla',         'ave',   'ave_nectarivora', 'Colibrí de altitudes medias y altas en los Andes colombianos.'),
  ('Amazilia fimbriata',       'Amazilia Pechiblanca',        'ave',   'ave_nectarivora', 'Colibrí abundante en bordes de bosque y jardines de Brasil.'),
  ('Chlorostilbon lucidus',    'Esmeralda Coliverde',         'ave',   'ave_nectarivora', 'Colibrí esmeralda del Cono Sur.'),
  ('Patagona gigas',           'Colibrí Gigante',             'ave',   'ave_nectarivora', 'El colibrí más grande del mundo; habita los Andes áridos.'),
  ('Amazilia chionogaster',    'Colibrí Ventriblanco',        'ave',   'ave_nectarivora', 'Colibrí del noroeste argentino.'),
  ('Oreotrochilus estella',    'Picaflor de la Puna',         'ave',   'ave_nectarivora', 'Colibrí de altura asociado a floraciones de la puna boliviana.'),
  ('Sephanoides sephaniodes',  'Colibrí Rubí',                'ave',   'ave_nectarivora', 'Colibrí austral, principal polinizador de la flora de Chile central.'),
  ('Sephanoides fernandensis', 'Colibrí de Juan Fernández',   'ave',   'ave_nectarivora', 'Colibrí endémico del archipiélago de Juan Fernández.'),
  ('Panterpe insignis',        'Colibrí Montañés',            'ave',   'ave_nectarivora', 'Colibrí endémico de las tierras altas de Costa Rica.'),
  ('Eupherusa eximia',         'Colibrí Coliblanco',          'ave',   'ave_nectarivora', 'Colibrí de bosques húmedos y cafetales costarricenses.'),
  ('Amazilia beryllina',       'Colibrí Esmeralda',           'ave',   'ave_nectarivora', 'Colibrí esmeralda de Mesoamérica.'),
  ('Cynanthus latirostris',    'Colibrí Pico Ancho',          'ave',   'ave_nectarivora', 'Colibrí de jardines y zonas áridas de México.'),
  ('Amazilia versicolor',      'Amazilia Tornasolada',        'ave',   'ave_nectarivora', 'Colibrí común en el bosque atlántico del Paraguay.'),
  ('Anthracothorax viridigula','Colibrí Garganta Verde',      'ave',   'ave_nectarivora', 'Colibrí de manglares y zonas húmedas del norte de Venezuela.'),
  ('Amazilia tobaci',          'Amazilia Cobre',              'ave',   'ave_nectarivora', 'Colibrí de patios y jardines venezolanos.'),
  -- Mamíferos (murciélagos nectarívoros + mamíferos del matorral)
  ('Glossophaga soricina',     'Murciélago Lengüilargo Común','mamifero','mamifero_nectarivoro','Murciélago nectarívoro de amplia distribución en el Neotrópico.'),
  ('Leptonycteris yerbabuenae','Murciélago Magueyero',        'mamifero','mamifero_nectarivoro','Polinizador clave de agaves y cactáceas columnares.'),
  ('Anoura geoffroyi',         'Murciélago Sin Cola de Geoffroy','mamifero','mamifero_nectarivoro','Murciélago de bosques nublados y cafetales de sombra.'),
  ('Anoura caudifer',          'Murciélago Sin Cola Común',   'mamifero','mamifero_nectarivoro','Murciélago nectarívoro de Sudamérica templada.'),
  ('Choeronycteris mexicana',  'Murciélago Trompudo',         'mamifero','mamifero_nectarivoro','Murciélago nectarívoro del centro y norte de México.'),
  ('Pygoderma bilabiatum',     'Murciélago de Hombros Amarillos','mamifero','mamifero_nectarivoro','Murciélago frugívoro-nectarívoro del Cono Sur.'),
  ('Leptonycteris curasoae',   'Murciélago Cardonero',        'mamifero','mamifero_nectarivoro','Polinizador de cardones y agaves en Venezuela.'),
  ('Glossophaga longirostris', 'Murciélago Lengüilargo de Los Tepuyes','mamifero','mamifero_nectarivoro','Murciélago nectarívoro del norte de Suramérica.'),
  ('Dromiciops gliroides',     'Monito del Monte',            'mamifero','mamifero_nectarivoro','Marsupial endémico del bosque valdiviano; polinizador y dispersor.'),
  ('Octodon degus',            'Degu',                        'mamifero','mamifero_nectarivoro','Roedor del matorral chileno; consume néctar y polen de flores nativas.');

-- ----------------------------------------------------------------------------
-- 4. CATÁLOGO DE POLINIZADORES POR PAÍS
--    Cada país lista, al menos, una abeja sin aguijón, una abeja solitaria,
--    un ave y un mamífero nativos.
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO pais_polinizador (pais_id, polinizador_id)
SELECT p.id, pol.id
FROM paises p, polinizadores pol
WHERE (p.nombre, pol.nombre_cientifico) IN (
  SELECT * FROM (VALUES
    -- Nicaragua
    ('Nicaragua','Melipona beecheii'), ('Nicaragua','Trigona fulviventris'),
    ('Nicaragua','Xylocopa'), ('Nicaragua','Centris'),
    ('Nicaragua','Anthracothorax nigricollis'), ('Nicaragua','Amazilia saucerottei'),
    ('Nicaragua','Glossophaga soricina'), ('Nicaragua','Leptonycteris yerbabuenae'),
    -- Colombia
    ('Colombia','Melipona compressipes'), ('Colombia','Tetragonisca angustula'),
    ('Colombia','Xylocopa'), ('Colombia','Centris'),
    ('Colombia','Coeligena torquata'), ('Colombia','Heliangelus strophianus'),
    ('Colombia','Glossophaga soricina'), ('Colombia','Anoura geoffroyi'),
    -- Brasil
    ('Brasil','Melipona quadrifasciata'), ('Brasil','Tetragonisca'),
    ('Brasil','Xylocopa'), ('Brasil','Centris'),
    ('Brasil','Amazilia fimbriata'), ('Brasil','Chlorostilbon lucidus'),
    ('Brasil','Glossophaga soricina'), ('Brasil','Anoura caudifer'),
    -- Argentina
    ('Argentina','Tetragonisca fiebrigi'), ('Argentina','Scaptotrigona jujuyensis'),
    ('Argentina','Xylocopa'), ('Argentina','Centris'),
    ('Argentina','Patagona gigas'), ('Argentina','Amazilia chionogaster'),
    ('Argentina','Glossophaga soricina'), ('Argentina','Anoura caudifer'),
    -- Bolivia
    ('Bolivia','Tetragonisca angustula'), ('Bolivia','Melipona rufiventris'),
    ('Bolivia','Xylocopa'), ('Bolivia','Centris'),
    ('Bolivia','Patagona gigas'), ('Bolivia','Oreotrochilus estella'),
    ('Bolivia','Glossophaga soricina'), ('Bolivia','Anoura geoffroyi'),
    -- Chile
    ('Chile','Manuelia postica'), ('Chile','Manuelia gayi'),
    ('Chile','Centris'), ('Chile','Colletes'),
    ('Chile','Sephanoides sephaniodes'), ('Chile','Sephanoides fernandensis'),
    ('Chile','Dromiciops gliroides'), ('Chile','Octodon degus'),
    -- Costa Rica
    ('Costa Rica','Melipona beecheii'), ('Costa Rica','Tetragonisca angustula'),
    ('Costa Rica','Xylocopa'), ('Costa Rica','Centris'),
    ('Costa Rica','Panterpe insignis'), ('Costa Rica','Eupherusa eximia'),
    ('Costa Rica','Glossophaga soricina'), ('Costa Rica','Anoura geoffroyi'),
    -- El Salvador
    ('El Salvador','Melipona beecheii'), ('El Salvador','Trigona fulviventris'),
    ('El Salvador','Xylocopa'), ('El Salvador','Centris'),
    ('El Salvador','Anthracothorax nigricollis'), ('El Salvador','Amazilia beryllina'),
    ('El Salvador','Glossophaga soricina'), ('El Salvador','Leptonycteris yerbabuenae'),
    -- México
    ('México','Melipona beecheii'), ('México','Scaptotrigona pectoralis'),
    ('México','Xylocopa'), ('México','Centris'),
    ('México','Amazilia beryllina'), ('México','Cynanthus latirostris'),
    ('México','Leptonycteris yerbabuenae'), ('México','Choeronycteris mexicana'),
    -- Paraguay
    ('Paraguay','Tetragonisca fiebrigi'), ('Paraguay','Scaptotrigona'),
    ('Paraguay','Xylocopa'), ('Paraguay','Centris'),
    ('Paraguay','Chlorostilbon lucidus'), ('Paraguay','Amazilia versicolor'),
    ('Paraguay','Glossophaga soricina'), ('Paraguay','Pygoderma bilabiatum'),
    -- Venezuela
    ('Venezuela','Melipona favosa'), ('Venezuela','Tetragonisca angustula'),
    ('Venezuela','Xylocopa'), ('Venezuela','Centris'),
    ('Venezuela','Anthracothorax viridigula'), ('Venezuela','Amazilia tobaci'),
    ('Venezuela','Leptonycteris curasoae'), ('Venezuela','Glossophaga longirostris'),
    ('Venezuela','Anoura geoffroyi')
  )
);

-- ----------------------------------------------------------------------------
-- 5. POLINIZADORES PRESENTES EN CADA MUNICIPIO
--    Cada municipio hereda el catálogo de su país y el `piso_climatico` decide:
--      - qué especies están presentes (filtro ecológico), y
--      - con qué abundancia aparecen.
--    Reglas:
--      * Abejas sin aguijón: presentes en pisos cálidos y templados (no en frío).
--      * Abejas solitarias (Xylocopa, Centris, Colletes) y los colibríes
--        generalistas: presentes en todos los pisos.
--      * En piso frío solo las aves adaptadas a altura/frío.
--      * Mamíferos nectarívoros: según su rango climático.
--    En todos los casos cada municipio conserva aves, abejas y mamíferos.
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO municipio_polinizador (municipio_id, polinizador_id, es_nativo, abundancia)
SELECT
  m.id,
  pp.polinizador_id,
  1,
  CASE
    WHEN pol.grupo = 'sin_aguijon'          AND m.piso_climatico IN ('calido_seco', 'calido_humedo') THEN 'abundante'
    WHEN pol.grupo = 'solitarias'           AND m.piso_climatico IN ('templado', 'frio')            THEN 'abundante'
    WHEN pol.grupo = 'ave_nectarivora'      AND m.piso_climatico IN ('templado', 'calido_humedo')   THEN 'abundante'
    WHEN pol.grupo = 'ave_nectarivora'      AND m.piso_climatico = 'calido_seco'                    THEN 'rara'
    WHEN pol.grupo = 'mamifero_nectarivoro' AND m.piso_climatico = 'calido_humedo'                  THEN 'abundante'
    WHEN pol.grupo = 'mamifero_nectarivoro' AND m.piso_climatico = 'frio'                           THEN 'rara'
    ELSE 'comun'
  END
FROM municipios m
JOIN pais_polinizador pp ON pp.pais_id = m.pais_id
JOIN polinizadores pol   ON pol.id = pp.polinizador_id
WHERE
  NOT (pol.grupo = 'sin_aguijon' AND m.piso_climatico = 'frio')
  AND NOT (
    pol.tipo = 'ave' AND m.piso_climatico = 'frio'
    AND pol.nombre_cientifico NOT IN (
      'Patagona gigas', 'Oreotrochilus estella',
      'Sephanoides sephaniodes', 'Heliangelus strophianus'
    )
  )
  AND NOT (
    pol.tipo = 'mamifero' AND NOT (
         pol.nombre_cientifico = 'Glossophaga soricina'
      OR (pol.nombre_cientifico = 'Dromiciops gliroides' AND m.piso_climatico IN ('templado', 'frio'))
      OR (pol.nombre_cientifico = 'Octodon degus'        AND m.piso_climatico IN ('calido_seco', 'templado'))
      OR (pol.nombre_cientifico IN ('Anoura geoffroyi', 'Anoura caudifer', 'Pygoderma bilabiatum')
            AND m.piso_climatico IN ('calido_humedo', 'templado'))
      OR (pol.nombre_cientifico IN ('Leptonycteris yerbabuenae', 'Choeronycteris mexicana')
            AND m.piso_climatico IN ('calido_seco', 'calido_humedo', 'templado'))
      OR (pol.nombre_cientifico IN ('Leptonycteris curasoae', 'Glossophaga longirostris')
            AND m.piso_climatico IN ('calido_seco', 'calido_humedo'))
    )
  );

-- Ajuste fino: los polinizadores emblemáticos de los municipios reales del
-- proyecto se marcan según los registros de monitoreo
-- (backend/src/data/monitoringData.js).
UPDATE municipio_polinizador
SET abundancia = 'abundante'
WHERE municipio_id = (SELECT id FROM municipios WHERE nombre_normalizado = 'matagalpa')
  AND polinizador_id IN (
    SELECT id FROM polinizadores WHERE nombre_cientifico IN ('Melipona beecheii', 'Xylocopa')
  );

UPDATE municipio_polinizador
SET abundancia = 'rara'
WHERE municipio_id = (SELECT id FROM municipios WHERE nombre_normalizado = 'matagalpa')
  AND polinizador_id IN (
    SELECT id FROM polinizadores WHERE nombre_cientifico IN ('Leptonycteris yerbabuenae')
  );

UPDATE municipio_polinizador
SET abundancia = 'abundante'
WHERE municipio_id = (SELECT id FROM municipios WHERE nombre_normalizado = 'pitalito')
  AND polinizador_id IN (
    SELECT id FROM polinizadores WHERE nombre_cientifico IN ('Tetragonisca angustula', 'Centris')
  );
