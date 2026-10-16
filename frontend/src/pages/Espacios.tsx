import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { TIPOS_ESPACIO, cultivoLabel, tipoEspacioLabel } from '../lib/catalog';
import { formatDate, formatNumber } from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState, ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Input, Select } from '../components/ui/Form';

export function Espacios() {
  const [pais, setPais] = useState('');
  const [tipo, setTipo] = useState('');
  const [search, setSearch] = useState('');

  const countries = useApi(() => api.getSpecies(), []);
  const spaces = useApi(() => api.getSpaces({ pais, tipo }), [pais, tipo]);

  const list = (spaces.data?.data ?? []).filter((space) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      (space.nombre_espacio ?? '').toLowerCase().includes(needle) ||
      (space.departamento_municipio ?? '').toLowerCase().includes(needle) ||
      (space.comunidad ?? '').toLowerCase().includes(needle)
    );
  });

  return (
    <>
      <PageHeader
        eyebrow="Espacios registrados"
        icon="📍"
        title="Red de espacios de la comunidad"
        description="Fincas, patios, escuelas y áreas comunales registradas con su recomendación personalizada, puntos e insignias."
        actions={<ButtonLink to="/segmentacion" iconLeft="＋">Registrar espacio</ButtonLink>}
      />

      <Card tone="elevated" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="grid grid-3">
          <Field label="País" htmlFor="f-pais">
            <Select id="f-pais" value={pais} onChange={(event) => setPais(event.target.value)}>
              <option value="">Todos los países</option>
              {(countries.data?.data ?? []).map((item) => (
                <option key={item.pais} value={item.pais}>
                  {item.pais}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo de espacio" htmlFor="f-tipo">
            <Select id="f-tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="">Todos los tipos</option>
              {TIPOS_ESPACIO.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Buscar" htmlFor="f-search" hint="Nombre, municipio o comunidad">
            <Input
              id="f-search"
              value={search}
              placeholder="Ej. El Mirador"
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
        </div>

        <div className="row row-wrap gap-3" style={{ marginTop: 'var(--space-4)' }}>
          <Badge tone="primary">{formatNumber(spaces.data?.total ?? 0)} espacios</Badge>
          {pais ? <Badge tone="secondary">{pais}</Badge> : null}
          {tipo ? <Badge tone="secondary">{tipoEspacioLabel(tipo)}</Badge> : null}
          {search ? <Badge tone="tertiary">búsqueda: “{search}”</Badge> : null}
          {(pais || tipo || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPais('');
                setTipo('');
                setSearch('');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {spaces.loading ? <LoadingBlock label="Cargando espacios…" /> : null}
      {spaces.error ? <ErrorBlock message={spaces.error} onRetry={spaces.reload} /> : null}

      {!spaces.loading && !spaces.error ? (
        list.length === 0 ? (
          <EmptyState
            title="No hay espacios que coincidan"
            description="Prueba con otros filtros o registra el primer espacio de esta comunidad."
            action={<ButtonLink to="/segmentacion" variant="outlined">Registrar un espacio</ButtonLink>}
          />
        ) : (
          <div className="grid grid-3">
            {list.map((space) => (
              <Card key={space.id} tone="elevated" interactive as="article">
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="title-sm">{space.nombre_espacio}</h3>
                    <p className="text-subtle">
                      {space.departamento_municipio ?? 'Sin municipio'}
                      {space.comunidad ? ` · ${space.comunidad}` : ''}
                    </p>
                  </div>
                  {space.certificado ? (
                    <Badge tone="tertiary" title="Sello Polinizador Amigo">
                      🏅
                    </Badge>
                  ) : null}
                </div>

                <div className="tag-list" style={{ marginTop: 'var(--space-4)' }}>
                  <Badge tone="primary">{tipoEspacioLabel(space.tipo_espacio)}</Badge>
                  <Badge tone="secondary">{cultivoLabel(space.cultivo_vegetacion)}</Badge>
                  <Badge tone="outline">{space.pais}</Badge>
                </div>

                <p className="text-muted" style={{ marginTop: 'var(--space-4)' }}>
                  🐝 {space.polinizador_principal ?? '—'}
                </p>

                <div className="row-between" style={{ marginTop: 'var(--space-5)' }}>
                  <div>
                    <div className="text-strong mono" style={{ fontSize: 'var(--text-lg)' }}>
                      {formatNumber(space.puntos_acumulados)} pts
                    </div>
                    <div className="text-subtle">
                      {space.insignia_emoji} {space.insignia_actual}
                    </div>
                  </div>
                  <Link to={`/espacios/${space.id}`} className="btn btn--outlined btn--sm">
                    Ver ficha
                  </Link>
                </div>

                <p className="text-subtle" style={{ marginTop: 'var(--space-3)' }}>
                  Registrado el {formatDate(space.fecha_registro)}
                </p>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </>
  );
}
