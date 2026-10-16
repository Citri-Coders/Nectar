import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { MUNICIPIOS_SUGERIDOS } from '../lib/catalog';
import { formatNumber, formatPercent } from '../lib/format';
import type { Coordinates } from '../lib/types';
import { MapView } from '../components/MapView';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Meter, ProgressBar, Stat } from '../components/ui/DataDisplay';
import { Alert } from '../components/ui/Alert';
import { ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Input } from '../components/ui/Form';

const DEFAULT_MUNICIPIO = 'Matagalpa';

export function Municipio() {
  const [draft, setDraft] = useState(DEFAULT_MUNICIPIO);
  const [municipio, setMunicipio] = useState(DEFAULT_MUNICIPIO);

  const spaces = useApi(() => api.getSpaces(), []);
  const dashboard = useApi(
    () => api.getMunicipioDashboard(municipio),
    [municipio]
  );
  const mapPoints = useApi(() => api.getMunicipioMapPoints(municipio), [municipio]);

  const municipiosDisponibles = useMemo(() => {
    const fromSpaces = (spaces.data?.data ?? [])
      .map((space) => space.departamento_municipio)
      .filter((value): value is string => Boolean(value));
    return [...new Set([...MUNICIPIOS_SUGERIDOS, ...fromSpaces])];
  }, [spaces.data]);

  const kpis = dashboard.data?.kpis;
  const puntos = mapPoints.data ?? [];

  const center: Coordinates | undefined = useMemo(() => {
    if (!puntos.length) return undefined;
    const lat = puntos.reduce((total, point) => total + point.lat, 0) / puntos.length;
    const lng = puntos.reduce((total, point) => total + point.lng, 0) / puntos.length;
    return { lat, lng };
  }, [puntos]);

  const maxPuntosComunidad = Math.max(
    1,
    ...(dashboard.data?.ranking_comunidades ?? []).map((item) => item.puntos_totales)
  );

  function consultar(value: string) {
    const limpio = value.trim();
    if (!limpio) return;
    setDraft(limpio);
    setMunicipio(limpio);
  }

  return (
    <>
      <PageHeader
        eyebrow="Néctar Municipio · Autoridades"
        icon="🏛️"
        title="Dashboard municipal"
        description="Indicadores de avance, conectividad de microcuenca, ranking de comunidades y mapa territorial de los espacios registrados."
        actions={
          <form
            className="row gap-2"
            style={{ minWidth: 320 }}
            onSubmit={(event) => {
              event.preventDefault();
              consultar(draft);
            }}
          >
            <Field label="" htmlFor="municipio-buscar">
              <Input
                id="municipio-buscar"
                list="municipios"
                value={draft}
                placeholder="Ej. Matagalpa"
                onChange={(event) => setDraft(event.target.value)}
                style={{ minWidth: 220 }}
              />
              <datalist id="municipios">
                {municipiosDisponibles.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>
            <Button type="submit" variant="primary" iconLeft="🔍">
              Consultar
            </Button>
          </form>
        }
      />

      <div className="row row-wrap gap-2" style={{ marginBottom: 'var(--space-6)' }}>
        <span className="text-subtle">Sugerencias:</span>
        {municipiosDisponibles.slice(0, 6).map((item) => (
          <button
            key={item}
            type="button"
            className="chip"
            onClick={() => consultar(item)}
            style={{ cursor: 'pointer' }}
          >
            {item}
          </button>
        ))}
      </div>

      {dashboard.loading ? <LoadingBlock label={`Cargando dashboard de ${municipio}…`} /> : null}

      {dashboard.error ? (
        <div className="stack stack-md">
          <ErrorBlock message={dashboard.error} onRetry={dashboard.reload} />
          <Alert tone="info" title="Municipios con datos disponibles">
            <div className="tag-list" style={{ marginTop: 'var(--space-3)' }}>
              {municipiosDisponibles.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="badge badge--primary"
                  onClick={() => consultar(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {item}
                </button>
              ))}
            </div>
          </Alert>
        </div>
      ) : null}

      {dashboard.data && kpis ? (
        <div className="stack stack-lg animate-in">
          <div className="row-between row-wrap">
            <div>
              <h2 className="title-lg">{dashboard.data.municipio}</h2>
              <p className="text-muted">
                {dashboard.data.pais} · {formatNumber(kpis.espacios_registrados)} espacios en seguimiento
              </p>
            </div>
            <Badge tone="tertiary" size="lg">
              🌿 Conectividad {formatPercent(kpis.indice_conectividad_porcentaje)}
            </Badge>
          </div>

          {/* ----------------------------------------------------------- KPIs */}
          <div className="grid grid-4">
            <Card tone="elevated">
              <Stat icon="📍" label="Espacios registrados" value={kpis.espacios_registrados} />
            </Card>
            <Card tone="elevated">
              <Stat icon="🌱" label="Prácticas implementadas" value={kpis.practicas_implementadas} tone="secondary" />
            </Card>
            <Card tone="elevated">
              <Stat
                icon="🐝"
                label="Polinizadores monitoreados"
                value={kpis.polinizadores_monitoreados}
                tone="tertiary"
              />
            </Card>
            <Card tone="elevated">
              <Stat
                icon="🏅"
                label="Certificaciones emitidas"
                value={kpis.certificaciones_emitidas}
                tone="info"
              />
            </Card>
          </div>

          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            {/* ---------------------------------- Ranking de comunidades */}
            <Card tone="elevated" padding="lg">
              <CardHead
                title="Ranking de comunidades"
                subtitle="Puntos acumulados por comunidad del municipio"
              />
              <div className="stack stack-md">
                {dashboard.data.ranking_comunidades.map((item, index) => (
                  <div key={item.comunidad} className="stack stack-sm">
                    <div className="row-between">
                      <span className="row gap-2">
                        <span className={index < 3 ? `rank rank--${index + 1}` : 'rank'}>
                          {index + 1}
                        </span>
                        <span className="text-strong">{item.comunidad}</span>
                      </span>
                      <span className="text-subtle">
                        {formatNumber(item.espacios)} espacios · {formatNumber(item.puntos_totales)} pts
                      </span>
                    </div>
                    <ProgressBar
                      value={(item.puntos_totales / maxPuntosComunidad) * 100}
                      tone={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary'}
                      label={`Puntos de ${item.comunidad}`}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* --------------------------------------- Conectividad */}
            <Card tone="elevated" padding="lg">
              <CardHead
                title="Conectividad de microcuenca"
                subtitle="Índice compuesto: densidad, cercas vivas y variedad de prácticas"
              />
              <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
                <div>
                  <div className="stat__value" style={{ fontSize: 'var(--text-4xl)' }}>
                    {formatPercent(dashboard.data.kpis.indice_conectividad_porcentaje)}
                  </div>
                  <div className="stat__label">Índice global</div>
                </div>
                <span style={{ fontSize: '2rem' }} aria-hidden>
                  🌳
                </span>
              </div>

              <div className="stack stack-md">
                <Meter
                  label="Densidad de espacios"
                  value={dashboard.data.conectividad_detalle.densidad_espacios}
                />
                <Meter
                  label="Cercas vivas (corredores)"
                  value={dashboard.data.conectividad_detalle.cercas_vivas}
                  tone="secondary"
                />
                <Meter
                  label="Variedad de prácticas"
                  value={dashboard.data.conectividad_detalle.variedad_practicas}
                  tone="tertiary"
                />
              </div>

              <p className="text-subtle" style={{ marginTop: 'var(--space-5)' }}>
                Herramienta de decisión: prioriza intervenciones en comunidades con menor
                conectividad para habilitar corredores biológicos.
              </p>
            </Card>
          </div>

          {/* ------------------------------------------------------------- Mapa */}
          <Card tone="elevated" padding="none" className="map-shell">
            <div className="row-between row-wrap" style={{ padding: 'var(--space-5)' }}>
              <div>
                <h3 className="card__title">Mapa territorial</h3>
                <p className="card__subtitle">
                  {mapPoints.loading
                    ? 'Cargando geopuntos…'
                    : `${formatNumber(puntos.length)} espacios georreferenciados`}
                </p>
              </div>
              <Badge tone="secondary">OpenStreetMap</Badge>
            </div>

            {mapPoints.error ? (
              <div style={{ padding: 'var(--space-5)' }}>
                <ErrorBlock message={mapPoints.error} onRetry={mapPoints.reload} />
              </div>
            ) : (
              <MapView points={puntos} center={center} zoom={12} />
            )}

            <div className="map-legend">
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: '#245C43' }} /> Café
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: '#7d621a' }} /> Cacao
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: '#d3ab34' }} /> Frutales
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: '#5f7a53' }} /> Hortalizas
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: '#4a7396' }} /> Sin cultivo
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: '#abc3a0' }} /> Ornamentales
              </span>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
