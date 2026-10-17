# Base de datos de biodiversidad (SQLite)

Jerarquía **PAÍS > MUNICIPIO > POLINIZADOR** (aves, abejas, mamíferos) de Néctar LatAm.

| Archivo | Descripción |
|---|---|
| `schema.sql` | Tablas, índices, vistas y consultas de ejemplo (idempotente). |
| `seed.sql` | Datos semilla: 11 países, 141 municipios y 45 polinizadores (idempotente). |
| `nectar.sqlite` | Base generada (se crea sola la primera vez; no se versiona). |

## Tablas

- `paises` — los 11 países del proyecto (`nombre_normalizado` permite filtrar sin tildes).
- `municipios` — municipios por país (`pais_id`), con `departamento`, `piso_climatico` y coordenadas.
- `polinizadores` — catálogo único con `tipo` (`abeja` | `ave` | `mamifero`) y `grupo`.
- `pais_polinizador` — polinizadores nativos de cada país (N:M).
- `municipio_polinizador` — polinizadores presentes en cada municipio (N:M). **Es la tabla del filtro por municipio.**
- `usuarios` — cuentas de la comunidad (`username`, `password_hash` scrypt, `salt`, `rol`).
- `sesiones` — tokens de sesión activos (`token`, `username`, `rol`, `usuario_id`). Sobreviven al reinicio del servidor.

Vistas: `vw_catalogo_pais_municipio`, `vw_resumen_municipio`, `vw_municipio_polinizadores_json`.

### Cobertura

| País | Municipios | País | Municipios |
|---|---|---|---|
| Argentina | 15 | Costa Rica | 10 |
| Bolivia | 11 | El Salvador | 13 |
| Brasil | 14 | México | 15 |
| Chile | 13 | Nicaragua | 13 |
| Colombia | 14 | Paraguay | 10 |
| Venezuela | 13 | **Total** | **141** |

Cada municipio tiene siempre **aves, abejas y mamíferos**. El `piso_climatico` del
municipio decide qué especies del catálogo nacional están presentes y su
`abundancia` (`abundante` / `comun` / `rara`): las abejas sin aguijón no aparecen
en piso frío, en frío solo quedan las aves adaptadas a altura (y en Chile el
monito del monte), y los murciélagos nectarívoros se filtran por su rango climático.

## Uso

```bash
cd backend
npm run db:init   # crea y pobla backend/db/nectar.sqlite
npm run dev       # la base se inicializa automáticamente al primer endpoint
```

La ruta del archivo se puede cambiar con la variable `NECTAR_DB_PATH`.
Requiere **Node >= 22** (usa el módulo nativo `node:sqlite`, sin dependencias extra).

La semilla es **auto-reparable**: se re-ejecuta en cada inicio (`INSERT OR IGNORE`),
así que los municipios o polinizadores nuevos se incorporan sin borrar la base.
Si cambia la estructura, `PRAGMA user_version` (`SCHEMA_VERSION` en
`backend/src/db/database.js`) regenera las tablas automáticamente.

## Endpoints

| Método y ruta | Descripción |
|---|---|
| `GET /api/v1/biodiversidad/paises` | Países con su número de municipios y polinizadores. |
| `GET /api/v1/biodiversidad/pais/:pais` | Detalle: municipios + catálogo de polinizadores. |
| `GET /api/v1/biodiversidad/paises/:pais/municipios` | Municipios del país con conteo por tipo. |
| `GET /api/v1/biodiversidad/municipios/:municipio/polinizadores` | **Filtra por municipio** y muestra sus polinizadores. Acepta `?pais=` y `?tipo=`. |
| `GET /api/v1/biodiversidad/polinizadores` | Catálogo global. Acepta `?tipo=`, `?grupo=`, `?pais=`, `?municipio=`. |
| `GET /api/v1/biodiversidad/catalogo` | Jerarquía completa país > municipio > polinizador. |

```bash
curl http://localhost:3000/api/v1/biodiversidad/municipios/Matagalpa/polinizadores
curl "http://localhost:3000/api/v1/biodiversidad/municipios/Matagalpa/polinizadores?tipo=ave"
curl "http://localhost:3000/api/v1/biodiversidad/polinizadores?tipo=mamifero&pais=Nicaragua"
```

## Frontend

La página **Polinizadores** (`frontend/src/pages/Polinizadores.tsx`, ruta `/polinizadores`)
consume estos endpoints: eliges país y municipio y muestra sus aves, abejas y mamíferos.
Los tipos y el cliente HTTP viven en `frontend/src/lib/types.ts`, `api.ts` y `catalog.ts`.
