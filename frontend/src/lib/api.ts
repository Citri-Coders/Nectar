import type {
  AdoptionInput,
  AdoptionResult,
  ApiErrorPayload,
  AuthResponse,
  BiodiversidadCatalogoPais,
  BiodiversidadPais,
  BiodiversidadPaisDetalle,
  BiodiversidadPolinizadorCatalogo,
  BiodiversidadMunicipiosResponse,
  DeleteMonitoringResponse,
  DeleteSpaceResponse,
  LeaderboardEntry,
  ListResponse,
  LoginInput,
  MapPoint,
  MonitoringHistory,
  MonitoringInput,
  MonitoringResult,
  MunicipioCatalogoPais,
  MunicipioDashboard,
  MunicipioPolinizadores,
  Producer,
  RegistroInput,
  SealFicha,
  Space,
  SpaceInput,
  SpeciesCountry,
  Usuario,
} from './types';

/**
 * Base de la API. En desarrollo Vite proxea `/api` hacia
 * http://localhost:3000 (ver vite.config.ts), por lo que no hay problemas
 * de CORS. Para apuntar a otro host basta con definir VITE_API_URL.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

/* -------------------------------------------------------------------------- */
/* Sesión (token + usuario en localStorage)                                   */
/* -------------------------------------------------------------------------- */

const TOKEN_KEY = 'nectar_token';
const USER_KEY = 'nectar_usuario';

/** Evento interno que avisa a la app de que la sesión dejó de ser válida. */
export const SESSION_EXPIRED_EVENT = 'nectar:session-expired';

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): Usuario | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthResponse): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.usuario));
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignorar */
  }
}

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(message: string, status: number, payload: ApiErrorPayload = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers,
      ...init,
    });
  } catch {
    throw new ApiError(
      'No se pudo contactar el servidor. Verifica que el backend esté corriendo en http://localhost:3000.',
      0
    );
  }

  const text = await response.text();
  const payload = text ? safeJson(text) : {};

  if (!response.ok) {
    // El token dejó de ser válido (sesión cerrada o expirada): se limpia la
    // sesión local y se avisa a la app para que refleje el cierre.
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    throw new ApiError(
      payload.message ?? `Error ${response.status} al consultar ${path}`,
      response.status,
      payload
    );
  }

  return payload as T;
}

function safeJson(text: string): ApiErrorPayload {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, value);
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : '';
}

export const api = {
  /* Autenticación ---------------------------------------------------------- */
  login: (input: LoginInput) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  registro: (input: RegistroInput) =>
    request<AuthResponse>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () => request<{ mensaje: string }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ usuario: Usuario }>('/auth/me'),

  /* Especies --------------------------------------------------------------- */
  getSpecies: (pais?: string) =>
    request<ListResponse<SpeciesCountry>>(`/species${query({ pais })}`),

  /* Espacios --------------------------------------------------------------- */
  getSpaces: (filters: { pais?: string; tipo?: string } = {}) =>
    request<ListResponse<Space>>(`/spaces${query(filters)}`),

  getSpace: (id: string) => request<Space>(`/spaces/${encodeURIComponent(id)}`),

  createSpace: (input: SpaceInput) =>
    request<Space>('/spaces/segmentation', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteSpace: (id: string) =>
    request<DeleteSpaceResponse>(`/spaces/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  /* Monitoreo -------------------------------------------------------------- */
  getMonitoringBySpace: (espacioId: string) =>
    request<MonitoringHistory>(
      `/monitoring/space/${encodeURIComponent(espacioId)}`
    ),

  registerMonitoring: (input: MonitoringInput) =>
    request<MonitoringResult>('/monitoring', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteMonitoring: (id: string) =>
    request<DeleteMonitoringResponse>(`/monitoring/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  /* Gamificación ----------------------------------------------------------- */
  getLeaderboard: () =>
    request<{ total: number; leaderboard: LeaderboardEntry[] }>('/gamification/leaderboard'),

  /* Municipio -------------------------------------------------------------- */
  getMunicipioCatalogo: () =>
    request<ListResponse<MunicipioCatalogoPais>>('/municipio/catalogo'),

  getMunicipioDashboard: (municipio: string, pais?: string) =>
    request<MunicipioDashboard>(
      `/municipio/dashboard/${encodeURIComponent(municipio)}${query({ pais })}`
    ),

  getMunicipioMapPoints: (municipio: string, pais?: string) =>
    request<MapPoint[]>(`/municipio/map-points/${encodeURIComponent(municipio)}${query({ pais })}`),

  /* Biodiversidad (SQLite) — País > Municipio > Polinizador ---------------- */
  getBiodiversidadPaises: () =>
    request<ListResponse<BiodiversidadPais>>('/biodiversidad/paises'),

  getBiodiversidadPais: (pais: string, filters: { tipo?: string } = {}) =>
    request<BiodiversidadPaisDetalle>(
      `/biodiversidad/pais/${encodeURIComponent(pais)}${query(filters)}`
    ),

  getBiodiversidadMunicipios: (pais: string) =>
    request<BiodiversidadMunicipiosResponse>(
      `/biodiversidad/paises/${encodeURIComponent(pais)}/municipios`
    ),

  getPolinizadoresDeMunicipio: (
    municipio: string,
    filters: { pais?: string; tipo?: string } = {}
  ) =>
    request<MunicipioPolinizadores>(
      `/biodiversidad/municipios/${encodeURIComponent(municipio)}/polinizadores${query(filters)}`
    ),

  getPolinizadores: (
    filters: { tipo?: string; grupo?: string; pais?: string; municipio?: string } = {}
  ) =>
    request<ListResponse<BiodiversidadPolinizadorCatalogo>>(
      `/biodiversidad/polinizadores${query(filters)}`
    ),

  getBiodiversidadCatalogo: () =>
    request<ListResponse<BiodiversidadCatalogoPais>>('/biodiversidad/catalogo'),

  /* Sello ------------------------------------------------------------------ */
  verifySeal: (idOSlug: string) =>
    request<SealFicha>(`/seal/verify/${encodeURIComponent(idOSlug)}`),

  getProducers: () => request<ListResponse<Producer>>('/seal/producers'),

  adoptHabitat: (input: AdoptionInput) =>
    request<AdoptionResult>('/seal/adopt', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

export { BASE_URL };
