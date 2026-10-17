import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import {
  CULTIVOS,
  PISOS_CLIMATICOS,
  PRACTICAS,
  TIPOS_ESPACIO,
  ZONAS,
  centroDePais,
  cultivoLabel,
  paisMasCercano,
  pisoLabel,
  tipoEspacioLabel,
} from '../lib/catalog';
import { formatNumber, grupoLabel } from '../lib/format';
import type { Coordinates, Space, SpaceInput } from '../lib/types';
import { PageHeader, Stepper } from '../components/ui/PageHeader';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge, Chip } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ErrorBlock } from '../components/ui/Feedback';
import { CheckOption, Field, Input, OptionGrid, Select } from '../components/ui/Form';
import { LocationPicker } from '../components/LocationPicker';

const STEPS = ['Ubicación', 'Espacio', 'Cultivo', 'Clima', 'Resultado'];

interface FormState {
  nombre_espacio: string;
  pais: string;
  departamento_municipio: string;
  comunidad: string;
  zona: string;
  tipo_espacio: string;
  cultivo_vegetacion: string;
  piso_climatico: string;
  practicas: string[];
  coordenadas: Coordinates | null;
}

const INITIAL: FormState = {
  nombre_espacio: '',
  pais: '',
  departamento_municipio: '',
  comunidad: '',
  zona: 'rural',
  tipo_espacio: '',
  cultivo_vegetacion: '',
  piso_climatico: '',
  practicas: [],
  coordenadas: null,
};

export function Segmentacion() {
  const countries = useApi(() => api.getSpecies(), []);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [result, setResult] = useState<Space | null>(null);

  const paisOptions = useMemo(
    () => (countries.data?.data ?? []).map((item) => item.pais),
    [countries.data]
  );

  // El mapa se encuadra en el país elegido (vista regional si aún no hay país).
  const encuadre = useMemo(() => centroDePais(form.pais), [form.pais]);

  // Sugerencia: si el punto marcado está cerca de otro país soportado, lo proponemos.
  const paisSugerido = useMemo(() => {
    if (!form.coordenadas) return null;
    const cercano = paisMasCercano(form.coordenadas);
    return cercano && cercano !== form.pais ? cercano : null;
  }, [form.coordenadas, form.pais]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate(target: number): boolean {
    const next: Record<string, string> = {};

    if (target >= 0) {
      if (!form.nombre_espacio.trim()) next.nombre_espacio = 'Ponle un nombre a tu espacio.';
      if (!form.pais) next.pais = 'Selecciona un país soportado.';
    }
    if (target >= 1 && !form.tipo_espacio) next.tipo_espacio = 'Selecciona el tipo de espacio.';
    if (target >= 2 && !form.cultivo_vegetacion)
      next.cultivo_vegetacion = 'Selecciona el cultivo o vegetación.';
    if (target >= 3 && !form.piso_climatico)
      next.piso_climatico = 'Selecciona el piso climático.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validate(step)) return;
    setStep((value) => Math.min(value + 1, 3));
  }

  function goBack() {
    setStep((value) => Math.max(value - 1, 0));
  }

  async function handleSubmit() {
    if (!validate(3)) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setMissingFields([]);

    const payload: SpaceInput = {
      nombre_espacio: form.nombre_espacio.trim(),
      pais: form.pais,
      tipo_espacio: form.tipo_espacio,
      cultivo_vegetacion: form.cultivo_vegetacion,
      piso_climatico: form.piso_climatico,
    };

    if (form.departamento_municipio.trim())
      payload.departamento_municipio = form.departamento_municipio.trim();
    if (form.comunidad.trim()) payload.comunidad = form.comunidad.trim();
    if (form.zona) payload.zona = form.zona;
    if (form.practicas.length) payload.practicas = form.practicas;
    if (form.coordenadas) payload.coordenadas = form.coordenadas;

    try {
      const space = await api.createSpace(payload);
      setResult(space);
      setStep(4);
    } catch (error) {
      if (error instanceof Error) setSubmitError(error.message);
      const payloadErrors = (error as { payload?: { campos_faltantes?: string[] } }).payload;
      if (payloadErrors?.campos_faltantes) setMissingFields(payloadErrors.campos_faltantes);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(INITIAL);
    setStep(0);
    setResult(null);
    setErrors({});
    setSubmitError(null);
    setMissingFields([]);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      <PageHeader
        eyebrow="Néctar Ciudadano"
        icon="🌱"
        title="Segmentación y plan personalizado"
        description="Responde 4 pasos y la API genera tu plan: polinizadores nativos, plantas recomendadas, tipo de nido y puntos de bienvenida."
        actions={
          <ButtonLink to="/monitoreo" variant="outlined">
            Ir a monitoreo
          </ButtonLink>
        }
      />

      <Card tone="elevated" padding="lg" className="animate-in">
        <div className="stack stack-md" style={{ marginBottom: 'var(--space-8)' }}>
          <Stepper steps={STEPS} current={step} onGoTo={setStep} />
          <div className="progress" aria-hidden>
            <div
              className="progress__bar"
              style={{ width: `${progress}%`, background: 'var(--primary-600)' }}
            />
          </div>
        </div>

        {/* -------------------------------------------------- Paso 1: Ubicación */}
        {step === 0 ? (
          <div className="stack stack-md">
            <h2 className="title-md">Paso 1 · ¿Dónde está tu espacio?</h2>
            <div className="grid grid-2">
              <Field label="Nombre del espacio" htmlFor="nombre" required error={errors.nombre_espacio}>
                <Input
                  id="nombre"
                  value={form.nombre_espacio}
                  placeholder="Ej. Finca El Mirador, Patio Doña Marta…"
                  onChange={(event) => update('nombre_espacio', event.target.value)}
                />
              </Field>

              <Field
                label="País"
                htmlFor="pais"
                required
                error={errors.pais}
                hint="Países soportados por la biblioteca de especies nativas."
              >
                <Select
                  id="pais"
                  value={form.pais}
                  onChange={(event) => update('pais', event.target.value)}
                >
                  <option value="">Selecciona un país…</option>
                  {paisOptions.map((pais) => (
                    <option key={pais} value={pais}>
                      {pais}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Departamento / Municipio"
                htmlFor="municipio"
                hint="Necesario para el dashboard municipal. Ej. Matagalpa."
              >
                <Input
                  id="municipio"
                  value={form.departamento_municipio}
                  placeholder="Ej. Matagalpa"
                  onChange={(event) => update('departamento_municipio', event.target.value)}
                />
              </Field>

              <Field label="Comunidad o barrio" htmlFor="comunidad">
                <Input
                  id="comunidad"
                  value={form.comunidad}
                  placeholder="Ej. El Arenal"
                  onChange={(event) => update('comunidad', event.target.value)}
                />
              </Field>
            </div>

            {countries.error ? <ErrorBlock message={countries.error} onRetry={countries.reload} /> : null}

            <Field label="Zona" hint="Opcional. Ayuda a clasificar el contexto del espacio.">
              <OptionGrid
                options={ZONAS}
                value={form.zona}
                onChange={(value) => update('zona', value)}
              />
            </Field>

            <Field
              label="Ubicación del espacio en el mapa"
              hint="Toca el mapa o arrastra el pin para ubicar tu espacio. Opcional: lo hace visible en el mapa municipal."
            >
              <LocationPicker
                value={form.coordenadas}
                center={encuadre.centro}
                zoom={encuadre.zoom}
                onChange={(coords) => update('coordenadas', coords)}
                referenceLabel={form.pais ? `País seleccionado: ${form.pais}` : undefined}
              />
            </Field>

            {paisSugerido ? (
              <Alert tone="info" title={`El punto marcado está cerca de ${paisSugerido}`}>
                <p>
                  Tu país seleccionado es {form.pais}. ¿Quieres usar {paisSugerido} para ajustar la
                  biblioteca de especies nativas?
                </p>
                <div className="row gap-3" style={{ marginTop: 'var(--space-3)' }}>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => update('pais', paisSugerido)}
                  >
                    Sí, usar {paisSugerido}
                  </Button>
                </div>
              </Alert>
            ) : null}
          </div>
        ) : null}

        {/* ---------------------------------------------- Paso 2: Tipo espacio */}
        {step === 1 ? (
          <div className="stack stack-md">
            <h2 className="title-md">Paso 2 · ¿Qué tipo de espacio es?</h2>
            {errors.tipo_espacio ? <span className="field__error">{errors.tipo_espacio}</span> : null}
            <OptionGrid
              options={TIPOS_ESPACIO}
              value={form.tipo_espacio}
              onChange={(value) => update('tipo_espacio', value)}
            />
          </div>
        ) : null}

        {/* ------------------------------------------------ Paso 3: Cultivo */}
        {step === 2 ? (
          <div className="stack stack-md">
            <h2 className="title-md">Paso 3 · ¿Qué cultivas o qué vegetación hay?</h2>
            {errors.cultivo_vegetacion ? (
              <span className="field__error">{errors.cultivo_vegetacion}</span>
            ) : null}
            <OptionGrid
              options={CULTIVOS}
              value={form.cultivo_vegetacion}
              onChange={(value) => update('cultivo_vegetacion', value)}
              columns="sm"
            />
          </div>
        ) : null}

        {/* --------------------------------------------------- Paso 4: Clima */}
        {step === 3 ? (
          <div className="stack stack-md">
            <h2 className="title-md">Paso 4 · Piso climático del terreno</h2>
            {errors.piso_climatico ? (
              <span className="field__error">{errors.piso_climatico}</span>
            ) : null}
            <OptionGrid
              options={PISOS_CLIMATICOS}
              value={form.piso_climatico}
              onChange={(value) => update('piso_climatico', value)}
            />

            <div className="stack stack-sm" style={{ marginTop: 'var(--space-4)' }}>
              <span className="field__label">Prácticas agroecológicas (opcional)</span>
              <span className="field__hint">
                Se usan para calcular la conectividad de microcuenca del municipio.
              </span>
              <div className="grid grid-2" style={{ marginTop: 'var(--space-2)' }}>
                {PRACTICAS.map((practica) => (
                  <CheckOption
                    key={practica.value}
                    label={practica.label}
                    icon={practica.icon}
                    name="practicas"
                    checked={form.practicas.includes(practica.value)}
                    onChange={(checked) =>
                      update(
                        'practicas',
                        checked
                          ? [...form.practicas, practica.value]
                          : form.practicas.filter((value) => value !== practica.value)
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {submitError ? (
              <Alert tone="danger" title="No se pudo registrar el espacio">
                <p>{submitError}</p>
                {missingFields.length ? (
                  <p className="text-subtle">Campos faltantes: {missingFields.join(', ')}</p>
                ) : null}
              </Alert>
            ) : null}
          </div>
        ) : null}

        {/* ----------------------------------------------- Paso 5: Resultado */}
        {step === 4 && result ? (
          <div className="stack stack-lg animate-in">
            <div className="grid grid-2" style={{ alignItems: 'start' }}>
              <div className="stack stack-md">
                <div className="row-between row-wrap">
                  <div>
                    <span className="eyebrow">🎉 Plan generado</span>
                    <h2 className="title-lg" style={{ marginTop: 'var(--space-2)' }}>
                      {result.nombre_espacio}
                    </h2>
                    <p className="text-muted">
                      {tipoEspacioLabel(result.tipo_espacio)} · {cultivoLabel(result.cultivo_vegetacion)} ·{' '}
                      {pisoLabel(result.piso_climatico)}
                    </p>
                  </div>
                  <Badge tone="tertiary" size="lg">
                    {result.insignia_emoji} {result.insignia_actual}
                  </Badge>
                </div>

                <Card tone="accent">
                  <p className="eyebrow eyebrow--inverse">{grupoLabel(result.grupo_polinizador)}</p>
                  <div style={{ marginTop: 'var(--space-4)' }} className="grid grid-2">
                    <div>
                      <p className="text-subtle" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Polinizador principal
                      </p>
                      <p className="text-strong" style={{ color: '#fff', fontSize: 'var(--text-lg)' }}>
                        🐝 {result.polinizador_principal}
                      </p>
                    </div>
                    <div>
                      <p className="text-subtle" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Polinizador secundario
                      </p>
                      <p className="text-strong" style={{ color: '#fff', fontSize: 'var(--text-lg)' }}>
                        🐝 {result.polinizador_secundario}
                      </p>
                    </div>
                  </div>
                  {result.nota_polinizacion ? (
                    <p style={{ marginTop: 'var(--space-5)' }}>{result.nota_polinizacion}</p>
                  ) : null}
                </Card>

                <Card tone="elevated">
                  <CardHead title="Tipo de nido sugerido" />
                  <div className="row gap-3">
                    <span className="stat__icon stat__icon--tertiary" aria-hidden>
                      🪵
                    </span>
                    <p className="text-strong">{result.nido_sugerido}</p>
                  </div>
                </Card>
              </div>

              <div className="stack stack-md">
                <Card tone="elevated">
                  <CardHead
                    title="Plantas nativas recomendadas"
                    subtitle={`${result.plantas_recomendadas.length} especies aptas para tu piso climático`}
                  />
                  <div className="tag-list">
                    {result.plantas_recomendadas.map((planta) => (
                      <Chip key={planta} variant="plant">
                        🌿 {planta}
                      </Chip>
                    ))}
                  </div>
                </Card>

                <Card tone="elevated">
                  <CardHead title="Tu punto de partida" />
                  <div className="kv">
                    <span className="kv__k">Puntos otorgados</span>
                    <span className="kv__v mono">+{formatNumber(result.puntos_acumulados)}</span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Insignia</span>
                    <span className="kv__v">
                      {result.insignia_emoji} {result.insignia_actual}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Certificación</span>
                    <span className="kv__v">{result.certificacion}</span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Identificador</span>
                    <span className="kv__v mono">{result.id}</span>
                  </div>
                </Card>

                <Card tone="elevated">
                  <CardHead title="Siguientes pasos" />
                  <div className="stack stack-sm">
                    <ButtonLink
                      to={`/monitoreo?espacio=${encodeURIComponent(result.id)}`}
                      variant="primary"
                      block
                      iconLeft="🐝"
                    >
                      Registrar un avistamiento (+15 pts)
                    </ButtonLink>
                    <ButtonLink to={`/espacios/${result.id}`} variant="outlined" block>
                      Ver ficha del espacio
                    </ButtonLink>
                    <Button variant="ghost" block onClick={reset}>
                      Crear otro plan
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------------------- Navegación */}
        {step < 4 ? (
          <div className="row-between row-wrap" style={{ marginTop: 'var(--space-8)' }}>
            <Button variant="ghost" onClick={goBack} disabled={step === 0} iconLeft="←">
              Atrás
            </Button>

            {step < 3 ? (
              <Button variant="primary" onClick={goNext} iconRight="→">
                Continuar
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} disabled={submitting} iconLeft="✨">
                {submitting ? 'Generando plan…' : 'Generar plan personalizado'}
              </Button>
            )}
          </div>
        ) : null}
      </Card>
    </>
  );
}
