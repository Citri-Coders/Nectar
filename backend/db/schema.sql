-- ============================================================================
-- Néctar LatAm — Esquema de la base de datos de biodiversidad de polinizadores
-- ----------------------------------------------------------------------------
-- Motor:  SQLite 3
-- Archivo: backend/db/nectar.sqlite (se genera automáticamente al iniciar)
--
-- Jerarquía de la información:
--     PAÍS  >  MUNICIPIO  >  POLINIZADOR
--
-- Los polinizadores se clasifican en tres grupos (aves, abejas, mamíferos):
--     tipo = 'abeja'    | 'ave'      | 'mamifero'
--
-- Relaciones:
--     - Un país tiene muchos municipios (1:N).
--     - Un país tiene un catálogo de polinizadores nativos (N:M) vía
--       `pais_polinizador`.
--     - Un municipio registra los polinizadores presentes en su territorio
--       (N:M) vía `municipio_polinizador`; esta tabla es la que permite
--       filtrar por municipio y mostrar sus polinizadores. El campo
--       `piso_climatico` del municipio gobierna qué polinizadores del país
--       están presentes y con qué abundancia.
--
-- El script es idempotente: puede ejecutarse repetidamente sin duplicar
-- estructura (CREATE ... IF NOT EXISTS / DROP VIEW IF EXISTS).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. PAÍSES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paises (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre             TEXT    NOT NULL UNIQUE,      -- 'Nicaragua', 'Brasil', ...
  nombre_normalizado TEXT    NOT NULL UNIQUE,      -- 'nicaragua' (sin tildes, para filtros)
  codigo             TEXT,                         -- ISO 3166-1 alfa-3 (NIC, BRA, ...)
  centro_lat         REAL,                         -- centro geográfico aproximado
  centro_lng         REAL,
  zoom               INTEGER                       -- zoom sugerido en el mapa
);

-- ----------------------------------------------------------------------------
-- 2. MUNICIPIOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipios (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  pais_id            INTEGER NOT NULL,
  nombre             TEXT    NOT NULL,             -- 'Matagalpa', 'Pitalito', ...
  nombre_normalizado TEXT    NOT NULL,             -- 'matagalpa' (sin tildes, para filtros)
  departamento       TEXT,                         -- departamento / estado / provincia
  piso_climatico     TEXT    CHECK (
                       piso_climatico IS NULL OR
                       piso_climatico IN ('calido_seco', 'calido_humedo', 'templado', 'frio')
                     ),                            -- gobierna la variación de polinizadores
  lat                REAL,
  lng                REAL,
  FOREIGN KEY (pais_id) REFERENCES paises (id) ON DELETE CASCADE,
  UNIQUE (pais_id, nombre)
);

-- ----------------------------------------------------------------------------
-- 3. POLINIZADORES (aves, abejas, mamíferos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS polinizadores (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_cientifico TEXT    NOT NULL UNIQUE,       -- 'Melipona beecheii', 'Xylocopa', ...
  nombre_comun      TEXT    NOT NULL,              -- 'Abeja Chupapié', 'Colibrí Rubí', ...
  tipo              TEXT    NOT NULL
                    CHECK (tipo IN ('abeja', 'ave', 'mamifero')),
  grupo             TEXT    NOT NULL
                    CHECK (grupo IN (
                      'sin_aguijon',            -- abejas meliponas / trigonas
                      'solitarias',             -- Xylocopa, Centris, Colletes
                      'ave_nectarivora',        -- colibríes
                      'mamifero_nectarivoro'    -- murciélagos y monito del monte
                    )),
  descripcion       TEXT
);

-- ----------------------------------------------------------------------------
-- 4. CATÁLOGO DE POLINIZADORES POR PAÍS (N:M)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pais_polinizador (
  pais_id        INTEGER NOT NULL,
  polinizador_id INTEGER NOT NULL,
  PRIMARY KEY (pais_id, polinizador_id),
  FOREIGN KEY (pais_id)        REFERENCES paises (id)         ON DELETE CASCADE,
  FOREIGN KEY (polinizador_id) REFERENCES polinizadores (id)  ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. POLINIZADORES PRESENTES POR MUNICIPIO (N:M)  <-- filtro por municipio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipio_polinizador (
  municipio_id    INTEGER NOT NULL,
  polinizador_id  INTEGER NOT NULL,
  es_nativo       INTEGER NOT NULL DEFAULT 1 CHECK (es_nativo IN (0, 1)),
  abundancia      TEXT    NOT NULL DEFAULT 'comun'
                  CHECK (abundancia IN ('abundante', 'comun', 'rara')),
  PRIMARY KEY (municipio_id, polinizador_id),
  FOREIGN KEY (municipio_id)   REFERENCES municipios (id)     ON DELETE CASCADE,
  FOREIGN KEY (polinizador_id) REFERENCES polinizadores (id)  ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Índices de apoyo a los filtros más frecuentes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_municipios_pais        ON municipios (pais_id);
CREATE INDEX IF NOT EXISTS idx_municipios_norm        ON municipios (nombre_normalizado);
CREATE INDEX IF NOT EXISTS idx_municipios_piso        ON municipios (piso_climatico);
CREATE INDEX IF NOT EXISTS idx_polinizadores_tipo     ON polinizadores (tipo);
CREATE INDEX IF NOT EXISTS idx_polinizadores_grupo    ON polinizadores (grupo);
CREATE INDEX IF NOT EXISTS idx_pais_polinizador_pol   ON pais_polinizador (polinizador_id);
CREATE INDEX IF NOT EXISTS idx_municipio_pol_pol      ON municipio_polinizador (polinizador_id);
CREATE INDEX IF NOT EXISTS idx_municipio_pol_mp       ON municipio_polinizador (municipio_id);

-- ----------------------------------------------------------------------------
-- 6. USUARIOS Y SESIONES (autenticación de la comunidad)
-- ----------------------------------------------------------------------------
-- Roles del sistema:
--     'usuario'       -> registra espacios y monitoreos. Puede consultar todo.
--     'administrador' -> credenciales maestras; además puede eliminar datos.
--     'auditor'       -> credenciales maestras; solo consulta y revisa.
--
-- Las contraseñas nunca se guardan en claro: se almacena el hash (scrypt) y su
-- sal. Los roles maestros no tienen fila en `usuarios`: su sesión se crea con
-- `usuario_id = NULL`.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT    NOT NULL UNIQUE,          -- normalizado en minúsculas
  password_hash  TEXT    NOT NULL,                 -- scrypt en hexadecimal
  salt           TEXT    NOT NULL,                 -- sal aleatoria en hexadecimal
  rol            TEXT    NOT NULL DEFAULT 'usuario'
                 CHECK (rol IN ('usuario', 'administrador', 'auditor')),
  fecha_registro TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sesiones (
  token          TEXT    PRIMARY KEY,              -- identificador de sesión
  username       TEXT    NOT NULL,                 -- nombre mostrado
  rol            TEXT    NOT NULL
                 CHECK (rol IN ('usuario', 'administrador', 'auditor')),
  usuario_id     INTEGER,                          -- NULL para roles maestros
  fecha_creacion TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones (usuario_id);

-- ----------------------------------------------------------------------------
-- VISTAS
-- ----------------------------------------------------------------------------

-- Jerarquía completa en una sola tabla: país > municipio > polinizador.
DROP VIEW IF EXISTS vw_catalogo_pais_municipio;
CREATE VIEW vw_catalogo_pais_municipio AS
SELECT
  p.id   AS pais_id,
  p.nombre AS pais,
  m.id   AS municipio_id,
  m.nombre AS municipio,
  m.departamento,
  m.piso_climatico,
  pol.id AS polinizador_id,
  pol.nombre_cientifico,
  pol.nombre_comun,
  pol.tipo,
  pol.grupo,
  mp.es_nativo,
  mp.abundancia
FROM paises p
JOIN municipios m           ON m.pais_id = p.id
JOIN municipio_polinizador mp ON mp.municipio_id = m.id
JOIN polinizadores pol      ON pol.id = mp.polinizador_id;

-- Un registro por municipio con el conteo de polinizadores por tipo.
DROP VIEW IF EXISTS vw_resumen_municipio;
CREATE VIEW vw_resumen_municipio AS
SELECT
  p.nombre AS pais,
  m.id     AS municipio_id,
  m.nombre AS municipio,
  m.departamento,
  m.piso_climatico,
  SUM(pol.tipo = 'abeja')    AS abejas,
  SUM(pol.tipo = 'ave')      AS aves,
  SUM(pol.tipo = 'mamifero') AS mamiferos,
  COUNT(*)                   AS total_polinizadores
FROM paises p
JOIN municipios m             ON m.pais_id = p.id
JOIN municipio_polinizador mp ON mp.municipio_id = m.id
JOIN polinizadores pol        ON pol.id = mp.polinizador_id
GROUP BY m.id;

-- Un registro por municipio con sus polinizadores en un arreglo JSON.
-- Cómoda para poblar un selector de municipios y sus tarjetas.
DROP VIEW IF EXISTS vw_municipio_polinizadores_json;
CREATE VIEW vw_municipio_polinizadores_json AS
SELECT
  p.nombre AS pais,
  m.id     AS municipio_id,
  m.nombre AS municipio,
  m.departamento,
  m.piso_climatico,
  json_group_array(
    json_object(
      'id', pol.id,
      'nombre_cientifico', pol.nombre_cientifico,
      'nombre_comun', pol.nombre_comun,
      'tipo', pol.tipo,
      'grupo', pol.grupo,
      'es_nativo', mp.es_nativo,
      'abundancia', mp.abundancia
    )
  ) AS polinizadores
FROM paises p
JOIN municipios m             ON m.pais_id = p.id
JOIN municipio_polinizador mp ON mp.municipio_id = m.id
JOIN polinizadores pol        ON pol.id = mp.polinizador_id
GROUP BY m.id;

-- ============================================================================
-- CONSULTAS DE EJEMPLO
-- ============================================================================

-- (1) Filtrar por municipio y mostrar sus polinizadores.
--     SELECT pais, municipio, nombre_comun, tipo, abundancia
--     FROM vw_catalogo_pais_municipio
--     WHERE municipio = 'Matagalpa'
--     ORDER BY tipo, nombre_comun;

-- (2) Filtrar por municipio sin distinguir tildes ni mayúsculas.
--     SELECT *
--     FROM vw_catalogo_pais_municipio
--     WHERE municipio = (SELECT nombre FROM municipios WHERE nombre_normalizado = 'pitalito')
--     ORDER BY tipo, nombre_comun;

-- (3) Jerarquía completa: país > municipio > polinizador.
--     SELECT pais, municipio, nombre_cientifico, nombre_comun, tipo
--     FROM vw_catalogo_pais_municipio
--     ORDER BY pais, municipio, tipo, nombre_comun;

-- (4) Municipios de un país con el conteo por tipo.
--     SELECT municipio, abejas, aves, mamiferos, total_polinizadores
--     FROM vw_resumen_municipio
--     WHERE pais = 'Nicaragua'
--     ORDER BY municipio;

-- (5) Polinizadores de un solo tipo (aves) en un municipio.
--     SELECT nombre_cientifico, nombre_comun
--     FROM vw_catalogo_pais_municipio
--     WHERE municipio = 'Matagalpa' AND tipo = 'ave';

-- (6) Polinizadores compartidos por dos municipios.
--     SELECT pol.nombre_comun
--     FROM municipio_polinizador a
--     JOIN municipio_polinizador b ON b.polinizador_id = a.polinizador_id
--     JOIN polinizadores pol       ON pol.id = a.polinizador_id
--     JOIN municipios ma           ON ma.id = a.municipio_id
--     JOIN municipios mb           ON mb.id = b.municipio_id
--     WHERE ma.nombre = 'Matagalpa' AND mb.nombre = 'Jinotega';

-- (7) Catálogo de polinizadores nativos de un país.
--     SELECT pol.nombre_cientifico, pol.nombre_comun, pol.tipo
--     FROM pais_polinizador pp
--     JOIN paises p          ON p.id = pp.pais_id
--     JOIN polinizadores pol ON pol.id = pp.polinizador_id
--     WHERE p.nombre = 'Nicaragua'
--     ORDER BY pol.tipo, pol.nombre_comun;
