import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { cultivoLabel, tipoEspacioLabel } from '../lib/catalog';
import { formatDateTime, formatNumber } from '../lib/format';
import type { MonitoringHistory, MonitoringResult } from '../lib/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState, ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Input, Select, Textarea } from '../components/ui/Form';

export function Monitoreo() {
  const [params, setParams] = useSearchParams();
  const spaces = useApi(() => api.getSpaces(), []);
  const species = useApi(() => api.getSpecies(), []);

  const [espacioId, setEspacioId] = useState(params.get('espacio') ?? '');
  const [polinizador, setPolinizador] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [fotoUrl, setFotoUrl] = useState('');
  const [notas, setNotas] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<MonitoringResult | null>(null);

  const history = useApi<MonitoringHistory | null>(
    () => (espacioId ? api.getMonitoringBySpace(espacioId) : Promise.resolve(null)),
    [espacioId]
  );

  const spaceList = spaces.data?.data ?? [];
  const selectedSpace = useMemo(
    () => spaceList.find((space) => space.id === espacioId) ?? null,
    [spaceList, espacioId]
  );

  useEffect(() => {
    if (espacioId) setParams({ espacio: espacioId }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacioId]);

  /** Sugerencias de polinizadores según el país del espacio seleccionado. */
  const sugerencias = useMemo(() => {
    if (!selectedSpace || !species.data) return [];
    const country = species.data.data.find((item) => item.pais === selectedSpace.pais);
    if (!country) return [];
    return [...country.abejasSinAguijon, ...country.abejasSolitarias];
  }, [selectedSpace, species.data]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!espacioId) {
      setFormError('Selecciona el espacio donde realizaste el avistamiento.');
      return;
    }
    if (!polinizador.trim()) {
      setFormError('Indica qué polinizador avistaste.');
      return;
    }
    const cantidadNum = Number(cantidad);
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      setFormError('La cantidad debe ser un número mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        espacio_id: espacioId,
        polinizador_avistado: polinizador.trim(),
        cantidad: cantidadNum,
        ...(fotoUrl.trim() ? { foto_url: fotoUrl.trim() } : {}),
        ...(notas.trim() ? { notas: notas.trim() } : {}),
        ...(lat.trim() && lng.trim() && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
          ? { coordenadas: { lat: Number(lat), lng: Number(lng) } }
          : {}),
      };

      const response = await api.registerMonitoring(payload);
      setResult(response);
      setPolinizador('');
      setCantidad('1');
      setNotas('');
      setFotoUrl('');
      spaces.reload();
      history.reload();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo registrar el monitoreo.');
    } finally {
      setSubmitting(false);
    }
  }

  const monitoreos = history.data?.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Néctar Ciudadano"
        icon="🐝"
        title="Monitoreo de polinizadores"
        description="Registra avistamientos de campo con foto y geolocalización opcional. Cada registro suma +15 puntos al espacio y actualiza su insignia."
        actions={<ButtonLink to="/ranking" variant="outlined">Ver ranking</ButtonLink>}
      />

      {spaces.error ? <ErrorBlock message={spaces.error} onRetry={spaces.reload} /> : null}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* --------------------------------------------------------- Formulario */}
        <Card tone="elevated" padding="lg">
          <CardHead
            title="Nuevo avistamiento"
            subtitle="Campos obligatorios: espacio, polinizador y cantidad."
          />

          <form className="stack stack-md" onSubmit={handleSubmit} noValidate>
            <Field label="Espacio" htmlFor="espacio" required>
              <Select
                id="espacio"
                value={espacioId}
                onChange={(event) => {
                  setEspacioId(event.target.value);
                  setPolinizador('');
                  setResult(null);
                }}
              >
                <option value="">Selecciona un espacio…</option>
                {spaceList.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.nombre_espacio} · {space.departamento_municipio ?? 'sin municipio'}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedSpace ? (
              <div className="row row-wrap gap-2">
                <Badge tone="primary">{tipoEspacioLabel(selectedSpace.tipo_espacio)}</Badge>
                <Badge tone="secondary">{cultivoLabel(selectedSpace.cultivo_vegetacion)}</Badge>
                <Badge tone="outline">
                  {selectedSpace.insignia_emoji} {formatNumber(selectedSpace.puntos_acumulados)} pts
                </Badge>
              </div>
            ) : null}

            <Field
              label="Polinizador avistado"
              htmlFor="polinizador"
              required
              hint={
                sugerencias.length
                  ? 'Sugerencias según el país del espacio. Puedes escribir otra especie.'
                  : 'Escribe el nombre científico o común.'
              }
            >
              <Input
                id="polinizador"
                list="sugerencias-polinizadores"
                value={polinizador}
                placeholder="Ej. Melipona beecheii"
                onChange={(event) => setPolinizador(event.target.value)}
              />
              <datalist id="sugerencias-polinizadores">
                {sugerencias.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>

            <div className="grid grid-2">
              <Field label="Cantidad" htmlFor="cantidad" required>
                <Input
                  id="cantidad"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(event) => setCantidad(event.target.value)}
                />
              </Field>

              <Field label="Foto (URL)" htmlFor="foto" hint="Opcional">
                <Input
                  id="foto"
                  value={fotoUrl}
                  placeholder="https://…"
                  onChange={(event) => setFotoUrl(event.target.value)}
                />
              </Field>

              <Field label="Latitud" htmlFor="lat" hint="Opcional">
                <Input
                  id="lat"
                  inputMode="decimal"
                  value={lat}
                  placeholder="12.9255"
                  onChange={(event) => setLat(event.target.value)}
                />
              </Field>

              <Field label="Longitud" htmlFor="lng" hint="Opcional">
                <Input
                  id="lng"
                  inputMode="decimal"
                  value={lng}
                  placeholder="-85.9178"
                  onChange={(event) => setLng(event.target.value)}
                />
              </Field>
            </div>

            <Field label="Notas de campo" htmlFor="notas" hint="Opcional">
              <Textarea
                id="notas"
                value={notas}
                placeholder="Ej. Transecto en la franja floral, floración de café."
                onChange={(event) => setNotas(event.target.value)}
              />
            </Field>

            {formError ? <Alert tone="danger">{formError}</Alert> : null}

            <Button type="submit" variant="primary" block disabled={submitting} iconLeft="🐝">
              {submitting ? 'Registrando…' : 'Registrar avistamiento (+15 pts)'}
            </Button>
          </form>

          {result ? (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Alert tone="success" title={result.mensaje}>
                <div className="stack stack-sm" style={{ marginTop: 'var(--space-3)' }}>
                  <div className="kv">
                    <span className="kv__k">Puntos ganados</span>
                    <span className="kv__v mono text-primary">+{result.puntos_ganados}</span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Puntos totales del espacio</span>
                    <span className="kv__v mono">{formatNumber(result.puntos_totales_espacio)}</span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Insignia</span>
                    <span className="kv__v">
                      {result.insignia_emoji} {result.insignia_actual}
                    </span>
                  </div>
                  {result.subio_nivel ? (
                    <Badge tone="tertiary">🎉 ¡El espacio subió de nivel!</Badge>
                  ) : null}
                </div>
              </Alert>
            </div>
          ) : null}
        </Card>

        {/* ----------------------------------------------------------- Historial */}
        <div className="stack stack-md">
          <Card tone="elevated">
            <CardHead
              title="Espacio seleccionado"
              subtitle={selectedSpace ? selectedSpace.nombre_espacio ?? '—' : 'Ninguno'}
            />
            {selectedSpace ? (
              <>
                <div className="grid grid-2">
                  <div>
                    <div className="stat__value">{formatNumber(selectedSpace.puntos_acumulados)}</div>
                    <div className="stat__label">Puntos acumulados</div>
                  </div>
                  <div>
                    <div className="stat__value">
                      {selectedSpace.insignia_emoji} {selectedSpace.insignia_actual}
                    </div>
                    <div className="stat__label">Insignia</div>
                  </div>
                </div>
                <div style={{ marginTop: 'var(--space-5)' }}>
                  <ButtonLink to={`/espacios/${selectedSpace.id}`} variant="outlined" size="sm" block>
                    Ver ficha completa
                  </ButtonLink>
                </div>
              </>
            ) : (
              <p className="text-muted">
                Elige un espacio para ver su historial y sus puntos actuales.
              </p>
            )}
          </Card>

          <Card tone="elevated">
            <CardHead
              title="Historial de avistamientos"
              subtitle={history.data ? `${history.data.total} registros` : undefined}
            />

            {!espacioId ? (
              <EmptyState icon="📍" title="Sin espacio seleccionado" />
            ) : history.loading ? (
              <LoadingBlock label="Cargando historial…" />
            ) : history.error ? (
              <ErrorBlock message={history.error} onRetry={history.reload} />
            ) : monitoreos.length === 0 ? (
              <EmptyState
                icon="🔎"
                title="Aún no hay avistamientos"
                description="Registra el primero con el formulario de la izquierda."
              />
            ) : (
              <div className="panel-scroll">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Polinizador</th>
                        <th>Cant.</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...monitoreos].reverse().map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.fecha_registro)}</td>
                          <td className="is-strong">{item.polinizador_avistado}</td>
                          <td className="mono">{item.cantidad}</td>
                          <td className="mono text-primary">+{item.puntos_otorgados}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
