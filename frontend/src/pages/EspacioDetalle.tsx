import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import {
  cultivoLabel,
  pisoLabel,
  practicaLabel,
  tipoEspacioLabel,
  zonaLabel,
} from '../lib/catalog';
import { formatDate, formatDateTime, formatNumber, grupoLabel } from '../lib/format';
import { MapView } from '../components/MapView';
import { ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge, Chip } from '../components/ui/Badge';
import { EmptyState, ErrorBlock, LoadingBlock } from '../components/ui/Feedback';

export function EspacioDetalle() {
  const { id = '' } = useParams();
  const space = useApi(() => api.getSpace(id), [id]);
  const history = useApi(() => api.getMonitoringBySpace(id), [id]);

  if (space.loading) return <LoadingBlock label="Cargando ficha del espacio…" />;
  if (space.error) return <ErrorBlock message={space.error} onRetry={space.reload} />;
  if (!space.data) return <EmptyState title="Espacio no encontrado" icon="🔍" />;

  const data = space.data;
  const monitoreos = history.data?.data ?? [];
  const totalPolinizadores = monitoreos.reduce((total, item) => total + item.cantidad, 0);

  return (
    <div className="stack stack-lg animate-in">
      <div className="row-between row-wrap" style={{ alignItems: 'flex-end' }}>
        <div className="stack stack-sm" style={{ maxWidth: '62ch' }}>
          <span className="eyebrow">
            <Link to="/espacios">Espacios</Link> · {data.id}
          </span>
          <h1 className="title-xl">{data.nombre_espacio}</h1>
          <div className="tag-list">
            <Badge tone="primary">{tipoEspacioLabel(data.tipo_espacio)}</Badge>
            <Badge tone="secondary">{cultivoLabel(data.cultivo_vegetacion)}</Badge>
            <Badge tone="outline">{pisoLabel(data.piso_climatico)}</Badge>
            <Badge tone="outline">{zonaLabel(data.zona)}</Badge>
            {data.certificado ? <Badge tone="tertiary">🏅 Polinizador Amigo</Badge> : null}
          </div>
        </div>

        <div className="row row-wrap gap-3">
          <ButtonLink to={`/monitoreo?espacio=${encodeURIComponent(data.id)}`} iconLeft="🐝">
            Registrar avistamiento
          </ButtonLink>
          <ButtonLink to="/espacios" variant="outlined">
            Volver
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-3">
        <Card tone="elevated">
          <span className="stat__icon" aria-hidden>⭐</span>
          <div className="stat__value" style={{ marginTop: 'var(--space-3)' }}>
            {formatNumber(data.puntos_acumulados)}
          </div>
          <div className="stat__label">Puntos acumulados</div>
        </Card>
        <Card tone="elevated">
          <span className="stat__icon stat__icon--tertiary" aria-hidden>
            {data.insignia_emoji}
          </span>
          <div className="stat__value" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
            {data.insignia_actual}
          </div>
          <div className="stat__label">Insignia actual</div>
        </Card>
        <Card tone="elevated">
          <span className="stat__icon stat__icon--secondary" aria-hidden>🐝</span>
          <div className="stat__value" style={{ marginTop: 'var(--space-3)' }}>
            {formatNumber(totalPolinizadores)}
          </div>
          <div className="stat__label">Polinizadores avistados</div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="stack stack-md">
          <Card tone="accent">
            <p className="eyebrow eyebrow--inverse">{grupoLabel(data.grupo_polinizador)}</p>
            <div className="grid grid-2" style={{ marginTop: 'var(--space-4)' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)' }}>
                  Polinizador principal
                </p>
                <p style={{ color: '#fff', fontWeight: 600 }}>🐝 {data.polinizador_principal}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)' }}>
                  Polinizador secundario
                </p>
                <p style={{ color: '#fff', fontWeight: 600 }}>🐝 {data.polinizador_secundario}</p>
              </div>
            </div>
            {data.nota_polinizacion ? (
              <p style={{ marginTop: 'var(--space-5)' }}>{data.nota_polinizacion}</p>
            ) : null}
          </Card>

          <Card tone="elevated">
            <CardHead title="Plantas nativas recomendadas" subtitle={data.nido_sugerido ?? undefined} />
            <div className="tag-list">
              {data.plantas_recomendadas.length ? (
                data.plantas_recomendadas.map((planta) => (
                  <Chip key={planta} variant="plant">
                    🌿 {planta}
                  </Chip>
                ))
              ) : (
                <span className="text-muted">Sin recomendaciones registradas.</span>
              )}
            </div>
          </Card>

          {data.practicas.length ? (
            <Card tone="elevated">
              <CardHead title="Prácticas agroecológicas implementadas" />
              <div className="tag-list">
                {data.practicas.map((practica) => (
                  <Badge key={practica} tone="secondary">
                    {practicaLabel(practica)}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="stack stack-md">
          <Card tone="elevated">
            <CardHead title="Ubicación y registro" />
            <div className="kv">
              <span className="kv__k">País</span>
              <span className="kv__v">{data.pais ?? '—'}</span>
            </div>
            <div className="kv">
              <span className="kv__k">Municipio</span>
              <span className="kv__v">{data.departamento_municipio ?? '—'}</span>
            </div>
            <div className="kv">
              <span className="kv__k">Comunidad</span>
              <span className="kv__v">{data.comunidad ?? '—'}</span>
            </div>
            <div className="kv">
              <span className="kv__k">Certificación</span>
              <span className="kv__v">{data.certificacion}</span>
            </div>
            <div className="kv">
              <span className="kv__k">Fecha de registro</span>
              <span className="kv__v">{formatDate(data.fecha_registro)}</span>
            </div>
          </Card>

          {data.coordenadas ? (
            <Card tone="elevated" padding="none" className="map-shell">
              <MapView
                points={[
                  {
                    id: data.id,
                    nombre: data.nombre_espacio,
                    tipo: data.tipo_espacio,
                    cultivo: data.cultivo_vegetacion,
                    lat: data.coordenadas.lat,
                    lng: data.coordenadas.lng,
                    polinizador_principal: data.polinizador_principal,
                    puntos: data.puntos_acumulados,
                    certificado: data.certificado,
                  },
                ]}
                center={data.coordenadas}
                zoom={14}
              />
            </Card>
          ) : null}
        </div>
      </div>

      <Card tone="elevated" padding="lg">
        <CardHead
          title="Historial de monitoreo"
          subtitle={`${history.data?.total ?? 0} avistamientos registrados en este espacio`}
          action={
            <ButtonLink to={`/monitoreo?espacio=${encodeURIComponent(data.id)}`} variant="ghost" size="sm">
              Añadir registro
            </ButtonLink>
          }
        />

        {history.loading ? <LoadingBlock label="Cargando historial…" /> : null}
        {history.error ? <ErrorBlock message={history.error} onRetry={history.reload} /> : null}

        {!history.loading && !history.error ? (
          monitoreos.length === 0 ? (
            <EmptyState
              icon="🔎"
              title="Todavía no hay avistamientos"
              description="Cada avistamiento suma +15 puntos y actualiza la insignia del espacio."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Polinizador</th>
                    <th>Cantidad</th>
                    <th>Puntos</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monitoreos].reverse().map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateTime(item.fecha_registro)}</td>
                      <td className="is-strong">{item.polinizador_avistado}</td>
                      <td className="mono">{formatNumber(item.cantidad)}</td>
                      <td className="mono text-primary">+{item.puntos_otorgados}</td>
                      <td className="text-muted">{item.notas ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </Card>
    </div>
  );
}
