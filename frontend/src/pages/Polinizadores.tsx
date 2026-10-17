import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import {
  TIPOS_POLINIZADOR,
  TONO_POR_ABUNDANCIA,
  abundanciaLabel,
  emojiPorTipoPolinizador,
  grupoPolinizadorLabel,
  pisoLabel,
} from '../lib/catalog';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Stat } from '../components/ui/DataDisplay';
import { Alert } from '../components/ui/Alert';
import { EmptyState, ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Select } from '../components/ui/Form';
import type { Abundancia, BiodiversidadPolinizador } from '../lib/types';

export function Polinizadores() {
  const paises = useApi(() => api.getBiodiversidadPaises(), []);

  // Sin precarga: la persona elige país, municipio y tipo manualmente.
  const [pais, setPais] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [tipo, setTipo] = useState('');

  const municipios = useApi(
    () => (pais ? api.getBiodiversidadMunicipios(pais) : Promise.resolve(null)),
    [pais]
  );
  const listaMunicipios = useMemo(() => municipios.data?.data ?? [], [municipios.data]);

  const resultado = useApi(
    () =>
      municipio
        ? api.getPolinizadoresDeMunicipio(municipio, { pais, tipo: tipo || undefined })
        : Promise.resolve(null),
    [municipio, pais, tipo]
  );

  const polinizadores = resultado.data?.data ?? [];
  const conteo = useMemo(() => {
    const inicial = { abeja: 0, ave: 0, mamifero: 0 };
    for (const pol of polinizadores) inicial[pol.tipo] += 1;
    return resultado.data?.polinizadores_por_tipo ?? inicial;
  }, [polinizadores, resultado.data]);

  const tiposVisibles = tipo
    ? TIPOS_POLINIZADOR.filter((item) => item.value === tipo)
    : TIPOS_POLINIZADOR;

  function cambiarPais(nuevoPais: string) {
    setPais(nuevoPais);
    setMunicipio('');
  }

  return (
    <>
      <PageHeader
        eyebrow="Néctar Biodiversidad · Base de datos SQLite"
        icon="🔎"
        title="Polinizadores por municipio"
        description="Explora la jerarquía País › Municipio › Polinizador. Elige un país y un municipio para ver sus aves, abejas y mamíferos polinizadores registrados."
        actions={
          <form
            className="row row-wrap gap-2"
            style={{ minWidth: 360 }}
            onSubmit={(event) => event.preventDefault()}
          >
            <Field htmlFor="bio-pais">
              <Select
                id="bio-pais"
                aria-label="País"
                value={pais}
                onChange={(event) => cambiarPais(event.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">Selecciona un país…</option>
                {(paises.data?.data ?? []).map((item) => (
                  <option key={item.id} value={item.nombre}>
                    {item.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="bio-municipio">
              <Select
                id="bio-municipio"
                aria-label="Municipio"
                value={municipio}
                onChange={(event) => setMunicipio(event.target.value)}
                disabled={!pais || municipios.loading || listaMunicipios.length === 0}
                style={{ minWidth: 170 }}
              >
                <option value="">
                  {pais ? 'Selecciona un municipio…' : 'Primero elige un país'}
                </option>
                {listaMunicipios.map((item) => (
                  <option key={item.id} value={item.nombre}>
                    {item.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="bio-tipo">
              <Select
                id="bio-tipo"
                aria-label="Tipo de polinizador"
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">Todos los tipos</option>
                {TIPOS_POLINIZADOR.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.icon} {item.label}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        }
      />

      {paises.error ? (
        <ErrorBlock message={paises.error} onRetry={paises.reload} />
      ) : municipios.error ? (
        <div className="stack stack-md">
          <ErrorBlock message={municipios.error} onRetry={municipios.reload} />
          <Alert tone="info" title="No pudimos cargar los municipios de este país">
            Revisa que el backend esté corriendo y que la base de datos SQLite se haya
            inicializado (<span className="mono">npm run db:init</span> en la carpeta backend).
          </Alert>
        </div>
      ) : resultado.error ? (
        <ErrorBlock message={resultado.error} onRetry={resultado.reload} />
      ) : (
        <div className="stack stack-lg">
          {/* ------------------------------------------------ Selector de municipios */}
          {pais ? (
            <div className="row row-wrap gap-2">
              <span className="text-subtle">Municipios de {pais}:</span>
              {municipios.loading ? <span className="text-subtle">cargando…</span> : null}
              {listaMunicipios.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="chip"
                  aria-pressed={item.nombre === municipio}
                  title={item.departamento ? `${item.nombre} · ${item.departamento}` : item.nombre}
                  onClick={() => setMunicipio(item.nombre)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.nombre}
                </button>
              ))}
            </div>
          ) : null}

          {!pais || !municipio ? (
            <EmptyState
              icon="🔎"
              title={!pais ? 'Selecciona un país' : 'Selecciona un municipio'}
              description={
                !pais
                  ? 'Elige un país, luego un municipio y un tipo de polinizador para ver los resultados.'
                  : 'Elige un municipio para ver sus aves, abejas y mamíferos polinizadores.'
              }
            />
          ) : null}

          {municipio && resultado.loading ? (
            <LoadingBlock label={`Cargando polinizadores de ${municipio}…`} />
          ) : null}

          {municipio && resultado.data ? (
            <div className="stack stack-lg animate-in">
              {/* ------------------------------------------------------------- KPIs */}
              <div>
                <div className="row-between row-wrap" style={{ marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h2 className="title-lg">
                      {resultado.data.municipio}
                    </h2>
                    <p className="text-muted">
                      {resultado.data.pais}
                      {resultado.data.departamento ? ` · ${resultado.data.departamento}` : ''}
                      {resultado.data.piso_climatico
                        ? ` · Piso ${pisoLabel(resultado.data.piso_climatico)}`
                        : ''}
                      {' · '}
                      {resultado.data.total} polinizadores registrados
                      {tipo ? ` · filtro: ${emojiPorTipoPolinizador(tipo)}` : ''}
                    </p>
                  </div>
                  <div className="row row-wrap gap-2">
                    {resultado.data.piso_climatico ? (
                      <Badge tone="secondary" title="Piso climático del municipio">
                        🌤️ {pisoLabel(resultado.data.piso_climatico)}
                      </Badge>
                    ) : null}
                    <Badge tone="tertiary" size="lg" title="Jerarquía País › Municipio › Polinizador">
                      🧬 País › Municipio › Polinizador
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-4">
                  <Card tone="elevated">
                    <Stat
                      icon="🧭"
                      label={tipo ? 'Total (filtrado)' : 'Total en el municipio'}
                      value={resultado.data.total}
                    />
                  </Card>
                  <Card tone="elevated">
                    <Stat icon="🐝" label="Abejas" value={conteo.abeja} tone="secondary" />
                  </Card>
                  <Card tone="elevated">
                    <Stat icon="🐦" label="Aves" value={conteo.ave} tone="tertiary" />
                  </Card>
                  <Card tone="elevated">
                    <Stat icon="🦇" label="Mamíferos" value={conteo.mamifero} tone="info" />
                  </Card>
                </div>
              </div>

              {/* ----------------------------------------- Polinizadores por tipo */}
              {tiposVisibles.map((grupo) => {
                const delTipo = polinizadores.filter((item) => item.tipo === grupo.value);
                return (
                  <Card key={grupo.value} tone="elevated" padding="lg">
                    <CardHead
                      title={`${grupo.icon} ${grupo.label}`}
                      subtitle={grupo.desc}
                      action={
                        <Badge tone="primary">
                          {delTipo.length} {delTipo.length === 1 ? 'especie' : 'especies'}
                        </Badge>
                      }
                    />
                    {delTipo.length === 0 ? (
                      <EmptyState
                        icon={grupo.icon}
                        title={`Sin ${grupo.label.toLowerCase()} con este filtro`}
                        description="Prueba con otro municipio o quita el filtro de tipo."
                      />
                    ) : (
                      <div className="grid grid-auto-sm">
                        {delTipo.map((pol) => (
                          <TarjetaPolinizador key={pol.id} polinizador={pol} />
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

/** Tarjeta de una especie de polinizador (nombre común + científico + grupo). */
function TarjetaPolinizador({ polinizador }: { polinizador: BiodiversidadPolinizador }) {
  const abundancia = (polinizador.abundancia ?? '') as Abundancia | '';
  const tono = abundancia ? TONO_POR_ABUNDANCIA[abundancia] : 'neutral';

  return (
    <article className="card card--pad-sm" style={{ height: '100%' }}>
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="text-strong">
            {emojiPorTipoPolinizador(polinizador.tipo)} {polinizador.nombre_comun}
          </div>
          <div className="text-subtle" style={{ fontStyle: 'italic' }}>
            {polinizador.nombre_cientifico}
          </div>
        </div>
        {abundancia ? (
          <Badge tone={tono} title={`Abundancia: ${abundanciaLabel(abundancia)}`}>
            {abundanciaLabel(abundancia)}
          </Badge>
        ) : null}
      </div>

      {polinizador.descripcion ? (
        <p className="text-subtle" style={{ marginTop: 'var(--space-3)' }}>
          {polinizador.descripcion}
        </p>
      ) : null}

      <div className="tag-list" style={{ marginTop: 'var(--space-3)' }}>
        <span className="chip">{grupoPolinizadorLabel(polinizador.grupo)}</span>
        {polinizador.es_nativo === false ? <span className="chip">Introducida</span> : null}
      </div>
    </article>
  );
}
