import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { PISOS_CLIMATICOS, labelOf } from '../lib/catalog';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHead } from '../components/ui/Card';
import { Badge, Chip } from '../components/ui/Badge';
import { ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Select } from '../components/ui/Form';
import { cn } from '../lib/cn';

export function Especies() {
  const { data, loading, error, reload } = useApi(() => api.getSpecies(), []);
  const [activePais, setActivePais] = useState<string | null>(null);
  const [piso, setPiso] = useState('');

  const countries = data?.data ?? [];
  const current = useMemo(() => {
    if (!countries.length) return null;
    return countries.find((item) => item.pais === activePais) ?? countries[0];
  }, [countries, activePais]);

  const plantasAptas = useMemo(() => {
    if (!current) return { aptas: 0, total: 0 };
    const total = current.catalogoPlantas.length;
    const aptas = piso
      ? current.catalogoPlantas.filter(
          (planta) => !planta.climas.length || planta.climas.includes(piso)
        ).length
      : total;
    return { aptas, total };
  }, [current, piso]);

  return (
    <>
      <PageHeader
        eyebrow="Néctar Diseño"
        icon="🧭"
        title="Biblioteca de especies nativas"
        description="Abejas sin aguijón, abejas solitarias y catálogo de plantas nativas por país con su aptitud por piso climático. Fuente: tabla 7.2 de la metodología Néctar LatAm."
        actions={
          <div style={{ minWidth: 220 }}>
            <Field label="Filtrar por piso climático" htmlFor="piso">
              <Select id="piso" value={piso} onChange={(event) => setPiso(event.target.value)}>
                <option value="">Todos los pisos</option>
                {PISOS_CLIMATICOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} · {item.desc}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        }
      />

      {loading ? <LoadingBlock label="Cargando especies nativas…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={reload} /> : null}

      {current ? (
        <div className="stack stack-lg">
          <div className="nav-links" role="group" aria-label="Países">
            {countries.map((item) => (
              <button
                key={item.pais}
                type="button"
                aria-pressed={item.pais === current.pais}
                className={cn('nav-link', item.pais === current.pais && 'nav-link--active')}
                onClick={() => setActivePais(item.pais)}
              >
                {item.pais}
              </button>
            ))}
          </div>

          <div className="grid grid-4">
            <Card tone="elevated">
              <CardHead title="Abejas sin aguijón" subtitle="Meliponas y trigonas" />
              <ul className="stack stack-sm">
                {current.abejasSinAguijon.map((abeja) => (
                  <li key={abeja} className="row gap-2">
                    <span aria-hidden>🐝</span>
                    <span className="text-strong">{abeja}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card tone="elevated">
              <CardHead title="Abejas solitarias" subtitle="Grandes y eficientes" />
              <ul className="stack stack-sm">
                {current.abejasSolitarias.map((abeja) => (
                  <li key={abeja} className="row gap-2">
                    <span aria-hidden>🐝</span>
                    <span className="text-strong">{abeja}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card tone="accent">
              <p className="eyebrow eyebrow--inverse">Resumen</p>
              <div className="stack stack-sm" style={{ marginTop: 'var(--space-4)' }}>
                <div>
                  <div className="hero__stat-value">{current.plantasNativas.length}</div>
                  <div className="hero__stat-label">Plantas nativas</div>
                </div>
                <div>
                  <div className="hero__stat-value">
                    {current.abejasSinAguijon.length + current.abejasSolitarias.length}
                  </div>
                  <div className="hero__stat-label">Polinizadores clave</div>
                </div>
              </div>
            </Card>

            <Card tone="elevated">
              <CardHead title="Aptas para tu filtro" subtitle={piso ? labelOf(PISOS_CLIMATICOS, piso) : 'Sin filtro activo'} />
              <div className="stat__value">
                {plantasAptas.aptas}
                <span className="text-muted" style={{ fontSize: 'var(--text-lg)' }}>
                  /{plantasAptas.total}
                </span>
              </div>
              <p className="text-subtle">plantas recomendables en ese piso climático</p>
            </Card>
          </div>

          <Card tone="elevated" padding="lg">
            <CardHead
              title={`Catálogo de plantas nativas · ${current.pais}`}
              subtitle="La recomendación de la API prioriza las plantas aptas para tu piso climático."
            />
            <div className="grid grid-auto-sm">
              {current.catalogoPlantas.map((planta) => {
                const apta = !piso || planta.climas.length === 0 || planta.climas.includes(piso);
                return (
                  <div
                    key={planta.nombre}
                    className={cn('card', 'card--pad-sm')}
                    style={{
                      borderColor: apta && piso ? 'var(--secondary-400)' : undefined,
                      background: apta && piso ? 'var(--secondary-50)' : undefined,
                      opacity: piso && !apta ? 0.62 : 1,
                    }}
                  >
                    <div className="row-between">
                      <span className="text-strong">🌿 {planta.nombre}</span>
                      {piso ? (
                        apta ? (
                          <Badge tone="secondary" title="Apta para el piso seleccionado">
                            ✓ apta
                          </Badge>
                        ) : (
                          <Badge tone="neutral" title="No óptima para el piso seleccionado">
                            —
                          </Badge>
                        )
                      ) : null}
                    </div>
                    <div className="tag-list" style={{ marginTop: 'var(--space-3)' }}>
                      {planta.climas.length ? (
                        planta.climas.map((clima) => (
                          <Chip key={clima}>{labelOf(PISOS_CLIMATICOS, clima)}</Chip>
                        ))
                      ) : (
                        <Chip>Generalista</Chip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
