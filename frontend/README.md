# Néctar LatAm · Frontend

Interfaz web (SPA) que consume la API Express ubicada en `../backend`.

- **Stack:** React 18 + Vite 5 + TypeScript
- **Ruteo:** React Router 6
- **Mapas:** Leaflet + OpenStreetMap
- **Estilos:** CSS propio con design tokens (sin framework de UI)
- **Tipografía:** Plus Jakarta Sans

---

## Requisitos

- Node.js 18 o superior

## Cómo ejecutarlo

Necesitas **dos terminales**: una para el backend y otra para el frontend.

### 1. Backend (puerto 3000)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**.

> Vite proxea `/api` hacia `http://localhost:3000` (ver `vite.config.ts`), por lo que
> en desarrollo no hay problemas de CORS y no hace falta configurar nada.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo de tipos (`tsc`) + build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run typecheck` | Solo el chequeo de tipos |

---

## Configuración de la API

Por defecto el cliente usa `/api/v1` (proxy de Vite). Para apuntar a otro host,
crea un archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Design system

La paleta se tomó del manual de marca del proyecto:

| Token | Hex | Uso |
|---|---|---|
| Primary | `#245C43` | Verde bosque · acciones principales, navbar activo |
| Secondary | `#ABC3A0` | Verde salvia · acentos suaves, estados secundarios |
| Tertiary | `#E8C65A` | Dorado miel · sellos, insignias, destacados |
| Neutral | `#F8F7F0` | Crema · fondos y superficies |

Los tokens viven en `src/styles/tokens.css` (escalas 50→900, tipografía, espaciado,
radios, sombras y colores semánticos). Los componentes base están en
`src/styles/components.css`.

### Componentes reutilizables (`src/components/ui/`)

`Button` / `ButtonLink`, `Card` / `CardHead`, `Badge` / `Chip`, `Alert`,
`Field` / `Input` / `Select` / `Textarea` / `OptionCard` / `CheckOption`,
`Stat` / `ProgressBar` / `Meter`, `PageHeader` / `Stepper`,
`Spinner` / `LoadingBlock` / `EmptyState` / `ErrorBlock`.

---

## Estructura

```
src/
├─ App.tsx                # rutas
├─ main.tsx               # entrypoint + CSS global
├─ components/
│  ├─ Layout.tsx          # navbar, outlet y footer
│  ├─ MapView.tsx         # mapa Leaflet con pines por cultivo
│  ├─ LocationPicker.tsx  # mapa interactivo para ubicar el espacio (paso 1)
│  └─ ui/                 # sistema de diseño
├─ hooks/
│  └─ useApi.ts           # fetch con estados loading/error/reload
├─ lib/
│  ├─ api.ts              # cliente HTTP tipado
│  ├─ types.ts            # contratos de la API
│  ├─ catalog.ts          # enums del formulario + etiquetas + colores + centros por país
│  ├─ validation.ts       # validación de URLs y montos no negativos
│  ├─ format.ts           # formateo de números, fechas y monedas
│  └─ cn.ts               # utilidad de clases
├─ pages/                 # una vista por módulo
└─ styles/                # tokens, base y componentes
```

---

## Mapa de endpoints → pantallas

| Endpoint del backend | Pantalla |
|---|---|
| `GET /api/v1/species` | `/especies`, filtros de país |
| `POST /api/v1/spaces/segmentation` | `/segmentacion` (asistente de 5 pasos) |
| `GET /api/v1/spaces` | `/espacios` (listado con filtros) |
| `GET /api/v1/spaces/:id` | `/espacios/:id` (ficha + historial) |
| `POST /api/v1/monitoring` | `/monitoreo` (registro +15 pts; hereda la ubicación del espacio) |
| `GET /api/v1/monitoring/space/:id` | `/monitoreo`, `/espacios/:id` |
| `GET /api/v1/gamification/leaderboard` | `/ranking` |
| `GET /api/v1/municipio/catalogo` | `/municipio` (municipios agrupados por país soportado) |
| `GET /api/v1/municipio/dashboard/:municipio?pais=` | `/municipio` (KPIs, comunidades, conectividad) |
| `GET /api/v1/municipio/map-points/:municipio?pais=` | `/municipio` (mapa territorial) |
| `GET /api/v1/seal/producers` | `/sello` (catálogo de fincas) |
| `GET /api/v1/seal/verify/:id_o_slug` | `/sello/verificar/:slug` (ficha QR) |
| `POST /api/v1/seal/adopt` | `/sello` (adopción de m² de hábitat) |

Notas de la API:

- Los filtros por país (`/species?pais=`, `/spaces?pais=`, `/municipio/…?pais=`) no
  distinguen mayúsculas ni tildes: `?pais=Mexico` y `?pais=México` son equivalentes.
  El filtro `/spaces?tipo=` también normaliza el formato (`Finca Agrícola` → `finca_agricola`).
- `GET /api/v1` devuelve un índice con todos los endpoints disponibles.
- Cualquier endpoint inexistente o cuerpo JSON inválido responde en **JSON**
  (nunca HTML), de modo que el cliente siempre puede mostrar el mensaje de error.

---

## Datos de prueba útiles

El backend siembra datos en memoria al arrancar:

- **Municipio:** `Matagalpa` (14 espacios, 3 comunidades) o `Pitalito, Huila` (1 espacio).
- **Slugs de sello:** `finca-el-mirador`; folios `SELLO-NIC-2026-004`, `-011`, `-017`, `-023`, `-029` y `-034`.
- **Países soportados:** Nicaragua, Colombia, Brasil, Argentina, Bolivia, Chile, Costa Rica, El Salvador, México, Paraguay y Venezuela.

> Los datos viven en memoria: al reiniciar el backend se restablecen las semillas.
