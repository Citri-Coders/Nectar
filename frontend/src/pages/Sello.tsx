import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { formatDate, formatM2, formatNumber, formatPercent, formatUsd } from '../lib/format';
import type { AdoptionResult } from '../lib/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ProgressBar } from '../components/ui/DataDisplay';
import { EmptyState, ErrorBlock, LoadingBlock } from '../components/ui/Feedback';
import { Field, Input, Select, Textarea } from '../components/ui/Form';

const PRECIO_POR_M2 = 0.5;

export function Sello() {
  const navigate = useNavigate();
  const producers = useApi(() => api.getProducers(), []);

  const [verifyInput, setVerifyInput] = useState('');
  const adoptRef = useRef<HTMLDivElement | null>(null);

  const [espacioId, setEspacioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [metros, setMetros] = useState('10');
  const [monto, setMonto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<AdoptionResult | null>(null);

  const lista = producers.data?.data ?? [];

  const seleccionado = useMemo(
    () => lista.find((item) => item.espacio_id === espacioId) ?? null,
    [lista, espacioId]
  );

  const metrosNum = Number(metros);
  const estimado =
    monto.trim() !== '' && Number.isFinite(Number(monto))
      ? Number(monto)
      : Number.isFinite(metrosNum)
        ? Number((metrosNum * PRECIO_POR_M2).toFixed(2))
        : 0;

  function verificar() {
    const limpio = verifyInput.trim();
    if (!limpio) return;
    if (limpio.startsWith('http')) {
      const parts = limpio.split('/');
      navigate(`/sello/verificar/${encodeURIComponent(parts[parts.length - 1])}`);
      return;
    }
    navigate(`/sello/verificar/${encodeURIComponent(limpio)}`);
  }

  function elegirProductor(id: string) {
    setEspacioId(id);
    setResult(null);
    setFormError(null);
    window.setTimeout(() => adoptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  async function handleAdopt(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!espacioId) {
      setFormError('Selecciona la finca que quieres apadrinar.');
      return;
    }
    if (!nombre.trim()) {
      setFormError('Indica tu nombre o el de tu organización.');
      return;
    }
    if (!Number.isFinite(metrosNum) || metrosNum <= 0) {
      setFormError('Los metros cuadrados deben ser un número mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.adoptHabitat({
        espacio_id: espacioId,
        nombre_consumidor: nombre.trim(),
        metros_cuadrados: metrosNum,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(monto.trim() && Number.isFinite(Number(monto)) ? { monto_usd: Number(monto) } : {}),
        ...(mensaje.trim() ? { mensaje_apoyo: mensaje.trim() } : {}),
      });
      setResult(response);
      producers.reload();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo registrar la adopción.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Néctar Sello · Productores y consumidores"
        icon="🏅"
        title="Sello Polinizador Amigo"
        description="Certificación para fincas que cumplen prácticas verificadas. Cada producto lleva un QR que abre la historia de la finca y permite adoptar metros de hábitat floral."
      />

      {/* ----------------------------------------------------------- Hero sello */}
      <Card tone="elevated" padding="lg" className="animate-in" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="seal-hero">
          <div className="stack stack-md">
            <span className="eyebrow">Trazabilidad verificable</span>
            <h2 className="title-lg">
              Del productor al consumidor, sin intermediarios en el impacto
            </h2>
            <p className="text-muted">
              La API de sello expone la ficha pública de cada certificación, el catálogo de
              productores y el registro de adopciones. Escanea un QR o verifica por folio o slug.
            </p>

            <form
              className="row row-wrap gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                verificar();
              }}
            >
              <div className="grow" style={{ minWidth: 240 }}>
                <Field label="Verificar sello" htmlFor="verify" hint="Folio (SELLO-NIC-…) o slug (finca-el-mirador)">
                  <Input
                    id="verify"
                    value={verifyInput}
                    placeholder="finca-el-mirador"
                    onChange={(event) => setVerifyInput(event.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" variant="primary" iconLeft="🔍" style={{ alignSelf: 'flex-end' }}>
                Verificar
              </Button>
            </form>
          </div>

          <div className="seal-badge" aria-hidden>
            <div className="seal-badge__inner">
              <div>
                <div className="seal-badge__bee">🐝</div>
                <div className="seal-badge__name">Polinizador Amigo</div>
                <div className="seal-badge__folio">Néctar LatAm · LatAm</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ------------------------------------------------------ Catálogo fincas */}
      <div className="stack stack-md" style={{ marginBottom: 'var(--space-10)' }}>
        <div className="row-between row-wrap">
          <div>
            <h2 className="title-lg">Productores certificados</h2>
            <p className="text-muted">
              {producers.data
                ? `${formatNumber(producers.data.total)} fincas con sello activo`
                : 'Cargando catálogo…'}
            </p>
          </div>
          <ButtonLink to="/municipio" variant="ghost">
            Ver en el mapa municipal
          </ButtonLink>
        </div>

        {producers.loading ? <LoadingBlock label="Cargando productores certificados…" /> : null}
        {producers.error ? <ErrorBlock message={producers.error} onRetry={producers.reload} /> : null}

        {!producers.loading && !producers.error ? (
          lista.length === 0 ? (
            <EmptyState icon="🏅" title="Todavía no hay fincas certificadas" />
          ) : (
            <div className="grid grid-3">
              {lista.map((producer) => {
                const porcentaje = producer.habitat_activo_m2
                  ? Math.min(
                      100,
                      (producer.metros_adoptados_por_consumidores / producer.habitat_activo_m2) * 100
                    )
                  : 0;
                return (
                  <Card key={producer.espacio_id} tone="elevated" as="article">
                    <div className="row-between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="title-sm">{producer.finca_nombre}</h3>
                        <p className="text-subtle">{producer.productor}</p>
                      </div>
                      <Badge tone="tertiary" title={producer.folio_certificacion}>
                        🏅
                      </Badge>
                    </div>

                    <div className="tag-list" style={{ marginTop: 'var(--space-4)' }}>
                      <Badge tone="secondary">{producer.cultivo}</Badge>
                      <Badge tone="outline">
                        {producer.municipio} · {producer.pais}
                      </Badge>
                    </div>

                    <div className="stack stack-sm" style={{ marginTop: 'var(--space-5)' }}>
                      <div className="row-between">
                        <span className="text-subtle">Hábitat activo</span>
                        <span className="text-strong">{formatM2(producer.habitat_activo_m2)}</span>
                      </div>
                      <div className="row-between">
                        <span className="text-subtle">Apadrinado</span>
                        <span className="text-strong">
                          {formatM2(producer.metros_adoptados_por_consumidores)}
                        </span>
                      </div>
                      <ProgressBar value={porcentaje} tone="tertiary" label="Hábitat apadrinado" />
                      <span className="text-subtle">{formatPercent(Math.round(porcentaje * 10) / 10)} apadrinado</span>
                    </div>

                    <div className="row gap-2" style={{ marginTop: 'var(--space-5)' }}>
                      <Button variant="primary" size="sm" onClick={() => elegirProductor(producer.espacio_id)}>
                        Adoptar m²
                      </Button>
                      <Link
                        to={`/sello/verificar/${producer.slug}`}
                        className="btn btn--outlined btn--sm"
                      >
                        Ver ficha
                      </Link>
                    </div>

                    <p className="text-subtle" style={{ marginTop: 'var(--space-3)' }}>
                      Certificado el {formatDate(producer.fecha_certificacion)} · {producer.folio_certificacion}
                    </p>
                  </Card>
                );
              })}
            </div>
          )
        ) : null}
      </div>

      {/* ---------------------------------------------------------- Adopciones */}
      <div ref={adoptRef}>
        <Card tone="elevated" padding="lg">
          <CardHead
            title="Adopta metros de hábitat floral"
            subtitle="Los fondos se distribuyen a las comunidades que mantienen los hábitats."
          />

          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <form className="stack stack-md" onSubmit={handleAdopt} noValidate>
              <Field label="Finca a apadrinar" htmlFor="finca" required>
                <Select
                  id="finca"
                  value={espacioId}
                  onChange={(event) => {
                    setEspacioId(event.target.value);
                    setResult(null);
                  }}
                >
                  <option value="">Selecciona una finca…</option>
                  {lista.map((producer) => (
                    <option key={producer.espacio_id} value={producer.espacio_id}>
                      {producer.finca_nombre} · {producer.municipio}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-2">
                <Field label="Tu nombre u organización" htmlFor="nombre" required>
                  <Input
                    id="nombre"
                    value={nombre}
                    placeholder="Ej. Café con Causa"
                    onChange={(event) => setNombre(event.target.value)}
                  />
                </Field>

                <Field label="Correo electrónico" htmlFor="email" hint="Opcional · para el comprobante">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="tu@correo.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>

                <Field label="Metros cuadrados" htmlFor="metros" required>
                  <Input
                    id="metros"
                    type="number"
                    min={1}
                    value={metros}
                    onChange={(event) => setMetros(event.target.value)}
                  />
                </Field>

                <Field
                  label="Monto (USD)"
                  htmlFor="monto"
                  hint="Opcional · si lo dejas vacío se calcula a $0.50 por m²"
                >
                  <Input
                    id="monto"
                    inputMode="decimal"
                    value={monto}
                    placeholder={`${(Number.isFinite(metrosNum) ? metrosNum * PRECIO_POR_M2 : 0).toFixed(2)}`}
                    onChange={(event) => setMonto(event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Mensaje de apoyo" htmlFor="mensaje" hint="Opcional · aparecerá junto a tu adopción">
                <Textarea
                  id="mensaje"
                  value={mensaje}
                  placeholder="¡Que vivan las abejas nativas!"
                  onChange={(event) => setMensaje(event.target.value)}
                />
              </Field>

              <Alert tone="info" title="Resumen de tu adopción">
                {seleccionado ? (
                  <p>
                    {formatM2(Number.isFinite(metrosNum) ? metrosNum : 0)} en{' '}
                    <strong>{seleccionado.finca_nombre}</strong> · aporte estimado {formatUsd(estimado)}
                  </p>
                ) : (
                  <p>Elige una finca para ver el resumen.</p>
                )}
              </Alert>

              {formError ? <Alert tone="danger">{formError}</Alert> : null}

              <Button type="submit" variant="primary" block disabled={submitting} iconLeft="🌼">
                {submitting ? 'Registrando adopción…' : 'Confirmar adopción'}
              </Button>
            </form>

            <div className="stack stack-md">
              {result ? (
                <Card tone="accent">
                  <p className="eyebrow eyebrow--inverse">Comprobante {result.comprobante.folio}</p>
                  <h3 className="title-sm" style={{ marginTop: 'var(--space-3)', color: '#fff' }}>
                    {result.mensaje}
                  </h3>

                  <div className="stack stack-sm" style={{ marginTop: 'var(--space-5)' }}>
                    <div className="kv" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.75)' }}>Finca</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {result.comprobante.finca_nombre}
                      </span>
                    </div>
                    <div className="kv" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.75)' }}>Productor</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {result.comprobante.productor}
                      </span>
                    </div>
                    <div className="kv" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.75)' }}>Metros adoptados</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {formatM2(result.comprobante.metros_cuadrados)}
                      </span>
                    </div>
                    <div className="kv" style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.75)' }}>Monto</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        {formatUsd(result.comprobante.monto_usd)}
                      </span>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card tone="elevated">
                  <CardHead title="¿Por qué adoptar?" />
                  <ul className="stack stack-sm text-muted">
                    <li>🌼 Financia kits de plantas nativas y capacitación.</li>
                    <li>🐝 Aumenta el hábitat disponible para abejas nativas.</li>
                    <li>📊 Genera datos verificables del servicio ecosistémico.</li>
                    <li>🤝 El fondo se distribuye a la comunidad que cuida el hábitat.</li>
                  </ul>
                </Card>
              )}

              {result ? (
                <Card tone="elevated">
                  <CardHead title="Impacto en la finca" />
                  <div className="stack stack-md">
                    <div>
                      <div className="stat__value">
                        {formatPercent(result.impacto.porcentaje_habitat_apadrinado)}
                      </div>
                      <div className="stat__label">del hábitat ya está apadrinado</div>
                    </div>
                    <ProgressBar
                      value={result.impacto.porcentaje_habitat_apadrinado}
                      tone="tertiary"
                      label="Hábitat apadrinado"
                    />
                    <div className="kv">
                      <span className="kv__k">Adoptado en total</span>
                      <span className="kv__v">{formatM2(result.impacto.metros_adoptados_totales_finca)}</span>
                    </div>
                    <div className="kv">
                      <span className="kv__k">Hábitat activo</span>
                      <span className="kv__v">{formatM2(result.impacto.habitat_activo_m2)}</span>
                    </div>
                    <ButtonLink
                      to={`/sello/verificar/${seleccionado?.slug ?? result.comprobante.espacio_id}`}
                      variant="outlined"
                      block
                    >
                      Ver la ficha pública de la finca
                    </ButtonLink>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
