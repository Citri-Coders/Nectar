import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { formatNumber } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState, ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Input } from '../components/ui/Form';
import type { LeaderboardEntry } from '../lib/types';

const NIVELES = [
  { emoji: '🥉', nombre: 'Semilla Nativa', min: 10 },
  { emoji: '🥈', nombre: 'Guardián de Flor', min: 50 },
  { emoji: '🥇', nombre: 'Maestro Meliponario', min: 150 },
];

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const tone = entry.posicion === 1 ? 'tertiary' : entry.posicion === 2 ? 'secondary' : 'primary';
  return (
    <Card tone="elevated" className="center">
      <Badge tone={tone} size="lg">
        #{entry.posicion}
      </Badge>
      <div style={{ fontSize: '2rem', marginTop: 'var(--space-4)' }} aria-hidden>
        {entry.insignia_emoji}
      </div>
      <h3 className="title-sm" style={{ marginTop: 'var(--space-2)' }}>
        {entry.nombre_espacio}
      </h3>
      <p className="text-subtle">
        {entry.municipio ?? '—'} · {entry.pais ?? '—'}
      </p>
      <div className="stat__value" style={{ marginTop: 'var(--space-4)' }}>
        {formatNumber(entry.puntos_acumulados)}
      </div>
      <p className="stat__label">puntos acumulados</p>
    </Card>
  );
}

export function Ranking() {
  const { data, loading, error, reload } = useApi(() => api.getLeaderboard(), []);
  const [search, setSearch] = useState('');

  const entries = data?.leaderboard ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const needle = search.trim().toLowerCase();
    return entries.filter(
      (entry) =>
        (entry.nombre_espacio ?? '').toLowerCase().includes(needle) ||
        (entry.municipio ?? '').toLowerCase().includes(needle) ||
        (entry.pais ?? '').toLowerCase().includes(needle)
    );
  }, [entries, search]);

  const top3 = entries.slice(0, 3);
  const totalPuntos = entries.reduce((total, entry) => total + entry.puntos_acumulados, 0);

  return (
    <>
      <PageHeader
        eyebrow="Néctar Red · Gamificación"
        icon="🏆"
        title="Ranking comunitario"
        description="Los espacios acumulan puntos con cada avistamiento registrado y desbloquean insignias. Así se incentiva la participación sostenida."
      />

      {loading ? <LoadingBlock label="Cargando ranking…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <div className="stack stack-lg">
          <div className="grid grid-3">
            <Card tone="elevated">
              <span className="stat__icon" aria-hidden>🐝</span>
              <div className="stat__value" style={{ marginTop: 'var(--space-3)' }}>
                {formatNumber(entries.length)}
              </div>
              <div className="stat__label">Espacios en competencia</div>
            </Card>
            <Card tone="elevated">
              <span className="stat__icon stat__icon--tertiary" aria-hidden>⭐</span>
              <div className="stat__value" style={{ marginTop: 'var(--space-3)' }}>
                {formatNumber(totalPuntos)}
              </div>
              <div className="stat__label">Puntos comunitarios totales</div>
            </Card>
            <Card tone="elevated">
              <span className="stat__icon stat__icon--secondary" aria-hidden>🥇</span>
              <div className="stat__value" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-lg)' }}>
                {entries[0]?.nombre_espacio ?? '—'}
              </div>
              <div className="stat__label">Líder actual</div>
            </Card>
          </div>

          {top3.length ? (
            <div className="grid grid-3">
              {top3.map((entry) => (
                <PodiumCard key={entry.espacio_id} entry={entry} />
              ))}
            </div>
          ) : null}

          <div className="grid grid-3" style={{ alignItems: 'start' }}>
            <Card tone="elevated" padding="lg" className="grow">
              <CardHead
                title="Tabla completa"
                subtitle={`${filtered.length} de ${entries.length} espacios`}
                action={
                  <div style={{ minWidth: 200 }}>
                    <Field htmlFor="buscar-rank">
                      <Input
                        id="buscar-rank"
                        aria-label="Buscar espacio o municipio"
                        value={search}
                        placeholder="Buscar espacio, municipio…"
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </Field>
                  </div>
                }
              />

              {filtered.length === 0 ? (
                <EmptyState icon="🔍" title="Sin resultados" description="Prueba con otro término de búsqueda." />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Espacio</th>
                        <th>Municipio</th>
                        <th>País</th>
                        <th>Insignia</th>
                        <th style={{ textAlign: 'right' }}>Puntos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((entry) => (
                        <tr key={entry.espacio_id}>
                          <td>
                            <span
                              className={
                                entry.posicion <= 3
                                  ? `rank rank--${entry.posicion}`
                                  : 'rank'
                              }
                            >
                              {entry.posicion}
                            </span>
                          </td>
                          <td className="is-strong">
                            <Link to={`/espacios/${entry.espacio_id}`}>{entry.nombre_espacio}</Link>
                          </td>
                          <td className="text-muted">{entry.municipio ?? '—'}</td>
                          <td className="text-muted">{entry.pais ?? '—'}</td>
                          <td>
                            <Badge tone="outline">
                              {entry.insignia_emoji} {entry.insignia_actual}
                            </Badge>
                          </td>
                          <td className="mono is-strong" style={{ textAlign: 'right' }}>
                            {formatNumber(entry.puntos_acumulados)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="stack stack-md">
              <Card tone="accent">
                <CardHead title="Cómo ganar puntos" subtitle="Reglas de gamificación" />
                <div className="kv" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Registro de espacio</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>+10 pts</span>
                </div>
                <div className="kv" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Cada avistamiento</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>+15 pts</span>
                </div>
              </Card>

              <Card tone="elevated">
                <CardHead title="Insignias" subtitle="Se recalculan automáticamente por puntos" />
                <div className="stack stack-sm">
                  {NIVELES.map((nivel) => (
                    <div key={nivel.nombre} className="kv">
                      <span className="kv__k">
                        {nivel.emoji} {nivel.nombre}
                      </span>
                      <span className="kv__v mono">{nivel.min}+ pts</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
