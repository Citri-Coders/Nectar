import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { COLOR_POR_CULTIVO, MUNICIPIOS_SUGERIDOS_POR_PAIS } from '../lib/catalog';
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
import { Field, Input, Select } from '../components/ui/Form';

const PAIS_INICIAL = 'Nicaragua';
const MUNICIPIO_INICIAL = 'Matagalpa';

/** Compara nombres de municipios sin distinguir mayúsculas ni tildes. */
function normalizar(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function Municipio() {
  const species = useApi(() => api.getSpecies(), []);
  const catalogo = useApi(() => api.getMunicipioCatalogo(), []);

  const [pais, setPais] = useState(PAIS_INICIAL);
  const [draftPais, setDraftPais] = useState(PAIS_INICIAL);
  const [municipio, setMunicipio] = useState(MUNICIPIO_INICIAL);
  const [draft, setDraft] = useState(MUNICIPIO_INICIAL);
  const [aviso, setAviso] = useState<string | null>(null);

  const dashboard = useApi(
    () => api.getMunicipioDashboard(municipio, pais),
    [municipio, pais]
  );
  const mapPoints = useApi(() => api.getMunicipioMapPoints(municipio, pais), [municipio, pais]);

  /** Países permitidos: los soportados por la biblioteca de especies nativas. */
  const paises = useMemo(
    () => (species.data?.data ?? []).map((item) => item.pais),
    [species.data]
  );

  const catalogoPaises = catalogo.data?.data ?? [];

  /** Municipios con datos del país elegido en el formulario de consulta. */
  const municipiosDelPais = useMemo(() => {
    const delCatalogo =
      catalogoPaises.find((item) => item.pais === draftPais)?.municipios.map((item) => item.nombre) ??
      [];
    const respaldo = MUNICIPIOS_SUGERIDOS_POR_PAIS[draftPais] ?? [];
    return [...new Set([...delCatalogo, ...respaldo])];
  }, [catalogoPaises, draftPais]);

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

  function cambiarPais(nuevoPais: string) {
    setDraftPais(nuevoPais);
    setAviso(null);
    const lista =
      catalogoPaises.find((item) => item.pais === nuevoPais)?.municipios.map((item) => item.nombre) ??
      [];
    setDraft(lista[0] ?? '');
  }

  function consultar(valor: string = draft) {
    const nombre = valor.trim();
    if (!nombre) {
      setAviso('Escribe el municipio que quieres consultar.');
      return;
    }

    const existe = municipiosDelPais.some((item) => normalizar(item) === normalizar(nombre));
    if (!existe) {
      setAviso(
        `"${nombre}" no es un municipio con datos de ${draftPais}. Solo puedes consultar los municipios de los países permitidos.`
      );
      return;
    }

    setAviso(null);
    setDraft(nombre);
    setPais(draftPais);
    setMunicipio(nombre);
  }

  /** Salta directo a un municipio ya validado (chips y atajos). */
  function irA(paisDestino: string, municipioDestino: string) {
    setAviso(null);
    setDraftPais(paisDestino);
    setDraft(municipioDestino);
    setPais(paisDestino);
    setMunicipio(municipioDestino);
  }

  return (
    <>
      <PageHeader
        eyebrow="Néctar Municipio · Autoridades"
        icon="🏛️"
        title="Dashboard municipal"
        description="Indicadores de avance, conectividad de microcuenca, ranking de comunidades y mapa territorial. Consulta los municipios de los países permitidos (Nicaragua, Colombia, Brasil, Chile, Costa Rica, Venezuela, El Salvador, México, Paraguay, Bolivia y Argentina)."
        actions={
          <form
            className="row row-wrap gap-2"
            style={{ minWidth: 320 }}
            onSubmit={(event) => {
              event.preventDefault();
              consultar();
            }}
          >
            <Field htmlFor="pais-buscar">
              <Select
                id="pais-buscar"
                aria-label="País del municipio"
                value={draftPais}
                onChange={(event) => cambiarPais(event.target.value)}
                style={{ minWidth: 160 }}
              >
                {paises.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="municipio-buscar">
              <Input
                id="municipio-buscar"
                aria-label="Municipio a consultar"
                list="municipios"
                value={draft}
                placeholder={municipiosDelPais[0] ?? 'Ej. Matagalpa'}
                onChange={(event) => setDraft(event.target.value)}
                style={{ minWidth: 220 }}
              />
              <datalist id="municipios">
                {municipiosDelPais.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>
            <Button
              type="submit"
              variant="primary"
              iconLeft="🔍"
              disabled={catalogo.loading || municipiosDelPais.length === 0}
            >
              Consultar
            </Button>
          </form>
        }
      />

      {aviso ? (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <Alert tone="warning" title="Municipio no disponible">
            {aviso}
          </Alert>
        </div>
      ) : null}

      <div className="row row-wrap gap-2" style={{ marginBottom: 'var(--space-6)' }}>
        <span className="text-subtle">Municipios de {draftPais}:</span>
        {catalogo.loading ? <span className="text-subtle">cargando…</span> : null}
        {municipiosDelPais.map((item) => (
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
        {!catalogo.loading && municipiosDelPais.length === 0 ? (
          <span className="text-subtle">
            Aún no hay municipios registrados en {draftPais}.
          </span>
        ) : null}
      </div>

      {dashboard.loading ? <LoadingBlock label={`Cargando dashboard de ${municipio}…`} /> : null}

      {dashboard.error ? (
        <div className="stack stack-md">
          <ErrorBlock message={dashboard.error} onRetry={dashboard.reload} />
          <Alert tone="info" title="Municipios con datos disponibles">
            <div className="tag-list" style={{ marginTop: 'var(--space-3)' }}>
              {catalogoPaises
                .filter((item) => item.municipios.length > 0)
                .map((item) => (
                  <span key={item.pais} className="stack stack-sm">
                    <span className="text-subtle">{item.pais}</span>
                    {item.municipios.map((municipioItem) => (
                      <button
                        key={`${item.pais}-${municipioItem.nombre}`}
                        type="button"
                        className="badge badge--primary"
                        onClick={() => irA(item.pais, municipioItem.nombre)}
                        style={{ cursor: 'pointer' }}
                      >
                        {municipioItem.nombre}
                      </button>
                    ))}
                  </span>
                ))}
            </div>
          </Alert>
        </div>
      ) : null}

      {!dashboard.loading && dashboard.data && kpis ? (
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
                <span className="legend-dot" style={{ background: COLOR_POR_CULTIVO.cafe }} /> Café
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: COLOR_POR_CULTIVO.cacao }} /> Cacao
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: COLOR_POR_CULTIVO.frutales }} /> Frutales
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: COLOR_POR_CULTIVO.hortalizas }} /> Hortalizas
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: COLOR_POR_CULTIVO.sin_cultivo }} /> Sin cultivo
              </span>
              <span className="map-legend__item">
                <span className="legend-dot" style={{ background: COLOR_POR_CULTIVO.ornamentales }} /> Ornamentales
              </span>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
