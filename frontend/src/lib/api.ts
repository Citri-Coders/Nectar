import type {
  AdoptionInput,
  AdoptionResult,
  ApiErrorPayload,
  LeaderboardEntry,
  ListResponse,
  MapPoint,
  MonitoringHistory,
  MonitoringInput,
  MonitoringResult,
  MunicipioDashboard,
  Producer,
  SealFicha,
  Space,
  SpaceInput,
  SpeciesCountry,
} from './types';

/**
 * Base de la API. En desarrollo Vite proxea `/api` hacia
 * http://localhost:3000 (ver vite.config.ts), por lo que no hay problemas
 * de CORS. Para apuntar a otro host basta con definir VITE_API_URL.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';

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

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
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

  /* Gamificación ----------------------------------------------------------- */
  getLeaderboard: () =>
    request<{ total: number; leaderboard: LeaderboardEntry[] }>('/gamification/leaderboard'),

  /* Municipio -------------------------------------------------------------- */
  getMunicipioDashboard: (municipio: string) =>
    request<MunicipioDashboard>(
      `/municipio/dashboard/${encodeURIComponent(municipio)}`
    ),

  getMunicipioMapPoints: (municipio: string) =>
    request<MapPoint[]>(`/municipio/map-points/${encodeURIComponent(municipio)}`),

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
