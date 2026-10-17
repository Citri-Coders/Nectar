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
| Primary | `#1b533a` | Verde bosque · acciones principales, navbar activo, hero |
| Secondary | `#facc15` | Amarillo miel · CTA, sellos, insignias, destacados |
| Superficies | `#ffffff` / `#f7f6f0` | Blanco y marfil orgánico · fondos y superficies |
| Tinta | `#142017` | Texto principal (verde muy oscuro) |

Los tokens viven en `src/styles/tokens.css` (escalas 50→900, tipografía, espaciado,
radios, sombras y colores semánticos). Los nombres `--color-*` corresponden al manual
y los nombres cortos (`--primary-*`, `--secondary-*`, `--tertiary-*`, `--neutral-*`)
se mantienen como alias de compatibilidad. Los componentes base están en
`src/styles/components.css`.

### Componentes reutilizables (`src/components/ui/`)

`Button` / `ButtonLink`, `Card` / `CardHead`, `Badge` / `Chip`, `Alert`, `FormErrors`,
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
│  ├─ RequireAuth.tsx     # guard: exige sesión para los módulos
│  ├─ MapView.tsx         # mapa Leaflet con pines por cultivo
│  ├─ LocationPicker.tsx  # mapa interactivo para ubicar el espacio (paso 1)
│  └─ ui/                 # sistema de diseño
├─ hooks/
│  └─ useApi.ts           # fetch con estados loading/error/reload
├─ lib/
│  ├─ api.ts              # cliente HTTP tipado (adjunta el token de sesión)
│  ├─ auth.tsx            # contexto de sesión (login, registro, roles) + localStorage
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
| `POST /api/v1/auth/registro` | `/registro` (crear cuenta de usuario) |
| `POST /api/v1/auth/login` | `/login` (usuario o credenciales maestras) |
| `POST /api/v1/auth/logout` | botón **Salir** de la navbar |
| `GET /api/v1/auth/me` | validación de la sesión al cargar |
| `GET /api/v1/species` | `/especies`, filtros de país |
| `POST /api/v1/spaces/segmentation` | `/segmentacion` (asistente de 5 pasos) |
| `GET /api/v1/spaces` | `/espacios` (listado con filtros) |
| `GET /api/v1/spaces/:id` | `/espacios/:id` (ficha + historial) |
| `DELETE /api/v1/spaces/:id` | `/espacios/:id` (solo administrador) |
| `POST /api/v1/monitoring` | `/monitoreo` (registro +15 pts; hereda la ubicación del espacio) |
| `GET /api/v1/monitoring/space/:id` | `/monitoreo`, `/espacios/:id` |
| `DELETE /api/v1/monitoring/:id` | `/monitoreo` (solo administrador) |
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

## Autenticación y roles

La navbar muestra **Login** y **Sign up** a la derecha. La lectura del sitio es libre;
para registrar datos hace falta una cuenta.

| Rol | Acceso | Puede ingresar datos | Puede eliminar datos |
|---|---|---|---|
| **Usuario** | Se registra con usuario y contraseña (se guardan en SQLite con hash scrypt) | Sí | No |
| **Administrador** | Contraseña maestra `admin1234` | Sí | Sí |
| **Auditor** | Contraseña maestra `admin1234` | No (solo consulta) | No |

- La sesión se guarda en `localStorage` y se envía al backend como `Authorization: Bearer <token>`.
- El administrador ve botones de **Eliminar** en la ficha del espacio y en el historial de monitoreo.

### Rutas protegidas

| Acceso | Rutas |
|---|---|
| **Público** | `/` (Inicio), `/login`, `/registro`, `/sello/verificar/:slug` y el 404 |
| **Requiere sesión** | `/segmentacion`, `/especies`, `/polinizadores`, `/espacios`, `/espacios/:id`, `/monitoreo`, `/ranking`, `/municipio`, `/sello` |

- El guard `src/components/RequireAuth.tsx` redirige a `/login` conservando el destino; al iniciar sesión se vuelve al módulo solicitado.
- La navbar y el footer solo muestran **Inicio** (más Login / Sign up) cuando no hay sesión.
- La API también protege la lectura: `/spaces`, `/monitoring`, `/municipio` y `/biodiversidad` responden `401` sin sesión. Quedan públicos `/health`, el índice `/api/v1`, `/auth/*`, `/species`, `/seal/producers`, `/seal/verify/*` y `/gamification/leaderboard` (los usa el Inicio y el QR público).

### Validación de datos

- Reglas iguales en el frontend (`src/lib/validation.ts`) y en el backend (`src/utils/validacion.js`): longitudes, rangos, enums, coordenadas, email y contraseña.
- Los formularios muestran un **banner resumen** (`src/components/ui/FormErrors.tsx`) con todos los mensajes; si la API responde `400`, se pintan sus `campos_invalidos` con el nombre legible de cada campo.

---

## Datos en memoria

El backend ya no siembra datos de prueba: los espacios, monitoreos, sellos y
adopciones se crean en tiempo de ejecución y viven en memoria, por lo que al
reiniciar el backend se vacían.- **Países soportados:** Nicaragua, Colombia, Brasil, Argentina, Bolivia, Chile, Costa Rica, El Salvador, México, Paraguay y Venezuela.
- **Catálogos de referencia:** las especies nativas y la jerarquía País › Municipio › Polinizador (`/api/v1/biodiversidad`) se cargan desde la base SQLite y siguen disponibles.
