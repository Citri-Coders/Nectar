import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { formatDate, formatM2, formatPercent } from '../lib/format';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ProgressBar } from '../components/ui/DataDisplay';
import { LoadingBlock } from '../components/ui/Feedback';

export function SelloVerificar() {
  const { slug = '' } = useParams();
  const ficha = useApi(() => api.verifySeal(slug), [slug]);

  if (ficha.loading) return <LoadingBlock label="Verificando sello…" />;

  if (ficha.error) {
    return (
      <div className="stack stack-lg">
        <Card tone="elevated" padding="lg">
          <Alert tone="danger" title="Sello no encontrado">
            <p>{ficha.error}</p>
            <p className="text-subtle" style={{ marginTop: 'var(--space-2)' }}>
              Verifica el folio o slug. También puedes consultar el catálogo de productores
              certificados.
            </p>
          </Alert>
          <div className="row row-wrap gap-3" style={{ marginTop: 'var(--space-5)' }}>
            <ButtonLink to="/sello" variant="primary">
              Ir al catálogo de productores
            </ButtonLink>
            <ButtonLink to="/" variant="outlined">
              Volver al inicio
            </ButtonLink>
            <Button variant="ghost" onClick={ficha.reload}>
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!ficha.data) return null;

  const data = ficha.data;
  const habitat = data.metricas_impacto.metros_cuadrados_habitat_activo;
  const adoptado = data.metricas_impacto.metros_adoptados_por_consumidores;
  const porcentaje = habitat ? Math.min(100, (adoptado / habitat) * 100) : 0;

  return (
    <div className="stack stack-lg animate-in">
      <div>
        <span className="eyebrow">
          <Link to="/sello">Sello</Link> · verificación de trazabilidad
        </span>
      </div>

      <Card tone="elevated" padding="lg">
        <div className="seal-hero">
          <div className="stack stack-md">
            <div className="row row-wrap gap-3">
              <Badge tone={data.sello_valido ? 'primary' : 'danger'} size="lg">
                {data.sello_valido ? '✅ Sello válido y activo' : '⛔ Sello inactivo'}
              </Badge>
              <Badge tone="outline">{data.folio_certificacion}</Badge>
            </div>

            <h1 className="title-xl">{data.finca_nombre}</h1>
            <p className="text-muted">
              Productor: <strong className="text-strong">{data.productor}</strong> ·{' '}
              {data.municipio ?? '—'}, {data.pais ?? '—'}
            </p>

            <div className="tag-list">
              <Badge tone="secondary">{data.cultivo}</Badge>
              <Badge tone="tertiary">Certificado el {formatDate(data.fecha_certificacion)}</Badge>
            </div>

            <p className="text-muted" style={{ maxWidth: '56ch' }}>
              Esta finca mantiene hábitat floral activo y prácticas verificadas que protegen a
              los polinizadores nativos de la región.
            </p>

            <div className="row row-wrap gap-3">
              <ButtonLink to="/sello" variant="primary" iconLeft="🌼">
                Adoptar metros de hábitat
              </ButtonLink>
              <ButtonLink to="/sello" variant="outlined">
                Ver otros productores
              </ButtonLink>
            </div>
          </div>

          <div className="seal-badge" aria-hidden>
            <div className="seal-badge__inner">
              <div>
                <div className="seal-badge__bee">🐝</div>
                <div className="seal-badge__name">Polinizador Amigo</div>
                <div className="seal-badge__folio">{data.folio_certificacion}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Card tone="accent" padding="lg">
          <CardHead title="Polinizadores protegidos" subtitle="Abejas nativas asociadas a esta finca" />
          <ul className="stack stack-sm">
            {data.polinizadores_protegidos.map((item) => (
              <li key={item} className="row gap-2" style={{ color: '#fff' }}>
                <span aria-hidden>🐝</span>
                <span style={{ fontWeight: 600 }}>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card tone="elevated" padding="lg">
          <CardHead title="Prácticas verificadas" subtitle="Auditadas para el sello" />
          <div className="timeline">
            {data.practicas_verificadas.map((practica, index) => (
              <div className="timeline__item" key={practica}>
                <span className="timeline__dot">{index + 1}</span>
                <div className="timeline__text">
                  <p className="text-strong">{practica}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card tone="elevated" padding="lg">
        <CardHead
          title="Métricas de impacto"
          subtitle="Hábitat floral activo y adopciones de consumidores"
        />
        <div className="grid grid-3">
          <div>
            <div className="stat__value">{formatM2(habitat)}</div>
            <div className="stat__label">Hábitat floral activo</div>
          </div>
          <div>
            <div className="stat__value">{formatM2(adoptado)}</div>
            <div className="stat__label">Adoptado por consumidores</div>
          </div>
          <div>
            <div className="stat__value">{formatPercent(Math.round(porcentaje * 10) / 10)}</div>
            <div className="stat__label">Del hábitat apadrinado</div>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <ProgressBar value={porcentaje} tone="tertiary" label="Hábitat apadrinado" />
        </div>
      </Card>
    </div>
  );
}
