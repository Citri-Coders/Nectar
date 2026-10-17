import { useMemo, useRef, useState } from 'react';
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
import { mensajesDeError, validarTexto } from '../lib/validation';
import type { Coordinates, Space, SpaceInput } from '../lib/types';
import { PageHeader, Stepper } from '../components/ui/PageHeader';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge, Chip } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { FormErrors } from '../components/ui/FormErrors';
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

/** Datos de ubicación deducidos del punto marcado en el mapa. */
interface UbicacionResuelta {
  departamento_municipio: string;
  comunidad: string;
}

/**
 * Traduce unas coordenadas del mapa a `departamento/municipio` y
 * `comunidad/barrio` (geocodificación inversa sobre OpenStreetMap).
 * Devuelve null si el servicio no responde o no hay datos útiles.
 */
async function resolverUbicacion(
  coords: Coordinates,
  signal: AbortSignal
): Promise<UbicacionResuelta | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coords.lat),
    lon: String(coords.lng),
    zoom: '14',
    addressdetails: '1',
    'accept-language': 'es',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { address?: Record<string, string> };
  const a = data.address ?? {};

  const municipio =
    a.city || a.town || a.village || a.municipality || a.city_district || a.county || '';
  const departamento = a.state || a.province || a.region || '';
  const comunidad =
    a.neighbourhood ||
    a.suburb ||
    a.quarter ||
    a.hamlet ||
    a.village ||
    a.city_district ||
    a.residential ||
    a.farm ||
    a.croft ||
    a.isolated_dwelling ||
    a.borough ||
    '';

  const departamento_municipio =
    municipio && departamento && municipio !== departamento
      ? `${municipio}, ${departamento}`
      : municipio || departamento;

  // La comunidad no debe repetir el municipio ni el departamento.
  const normalizar = (valor: string) => valor.trim().toLowerCase();
  const comunidadLimpia =
    comunidad &&
    normalizar(comunidad) !== normalizar(municipio) &&
    normalizar(comunidad) !== normalizar(departamento)
      ? comunidad
      : '';

  if (!departamento_municipio && !comunidadLimpia) return null;
  return { departamento_municipio, comunidad: comunidadLimpia };
}

export function Segmentacion() {
  const countries = useApi(() => api.getSpecies(), []);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [erroresEnvio, setErroresEnvio] = useState<string[]>([]);
  const [result, setResult] = useState<Space | null>(null);
  const [resolviendoUbicacion, setResolviendoUbicacion] = useState(false);
  const geocodificacionRef = useRef<AbortController | null>(null);

  const paisOptions = useMemo(
    () => (countries.data?.data ?? []).map((item) => item.pais),
    [countries.data]
  );

  // Municipios del país seleccionado, para el desplegable de Departamento / Municipio.
  const municipiosPais = useApi(
    () => (form.pais ? api.getBiodiversidadMunicipios(form.pais) : Promise.resolve(null)),
    [form.pais]
  );

  const opcionesMunicipio = useMemo(() => {
    const lista = municipiosPais.data?.data ?? [];
    return lista.map((item) => ({
      value:
        item.departamento && item.departamento !== item.nombre
          ? `${item.nombre}, ${item.departamento}`
          : item.nombre,
      label: item.departamento ? `${item.nombre} · ${item.departamento}` : item.nombre,
    }));
  }, [municipiosPais.data]);

  // Si el punto del mapa completó un valor que no está en la lista, se conserva.
  const opcionesMunicipioActual = useMemo(() => {
    const actual = form.departamento_municipio.trim();
    if (actual && !opcionesMunicipio.some((opcion) => opcion.value === actual)) {
      return [{ value: actual, label: `${actual} (desde el mapa)` }, ...opcionesMunicipio];
    }
    return opcionesMunicipio;
  }, [opcionesMunicipio, form.departamento_municipio]);

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

  // Cambiar de país reinicia el municipio: la lista depende del país elegido.
  function cambiarPais(pais: string) {
    setForm((prev) => ({ ...prev, pais, departamento_municipio: '' }));
    setErrors((prev) => ({ ...prev, pais: '', departamento_municipio: '' }));
  }

  // Al marcar (o mover) el punto en el mapa, se completan el departamento/municipio
  // y la comunidad/barrio a partir de las coordenadas elegidas.
  async function ubicarEnMapa(coords: Coordinates | null) {
    update('coordenadas', coords);

    geocodificacionRef.current?.abort();
    if (!coords) {
      setResolviendoUbicacion(false);
      return;
    }

    const controller = new AbortController();
    geocodificacionRef.current = controller;
    setResolviendoUbicacion(true);

    try {
      const ubicacion = await resolverUbicacion(coords, controller.signal);
      if (!ubicacion) return;
      if (ubicacion.departamento_municipio)
        update('departamento_municipio', ubicacion.departamento_municipio);
      if (ubicacion.comunidad) update('comunidad', ubicacion.comunidad);
    } catch {
      // Si el servicio no responde, se conserva lo que la persona haya escrito.
    } finally {
      if (geocodificacionRef.current === controller) setResolviendoUbicacion(false);
    }
  }

  function validate(target: number): boolean {
    const next: Record<string, string> = {};

    if (target >= 0) {
      const errorNombre = validarTexto(form.nombre_espacio, { min: 3, max: 80 });
      if (errorNombre) next.nombre_espacio = errorNombre;
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
    setErroresEnvio([]);

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
      setErroresEnvio(mensajesDeError(error));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(INITIAL);
    setStep(0);
    setResult(null);
    setErrors({});
    setErroresEnvio([]);
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
                  placeholder="Ej. Finca La Colmena, Patio de casa…"
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
                  onChange={(event) => cambiarPais(event.target.value)}
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
                hint={
                  resolviendoUbicacion
                    ? 'Ubicando el punto en el mapa…'
                    : !form.pais
                      ? 'Primero selecciona un país para ver sus municipios.'
                      : municipiosPais.loading
                        ? 'Cargando municipios del país…'
                        : municipiosPais.error
                          ? 'No se pudieron cargar los municipios; puedes marcar la ubicación en el mapa.'
                          : `${municipiosPais.data?.total ?? opcionesMunicipio.length} municipios disponibles.`
                }
              >
                <Select
                  id="municipio"
                  value={form.departamento_municipio}
                  disabled={!form.pais || municipiosPais.loading}
                  onChange={(event) => update('departamento_municipio', event.target.value)}
                >
                  <option value="">
                    {form.pais ? 'Selecciona un municipio…' : 'Primero selecciona un país…'}
                  </option>
                  {opcionesMunicipioActual.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Comunidad o barrio"
                htmlFor="comunidad"
                hint={
                  resolviendoUbicacion
                    ? 'Ubicando el punto en el mapa…'
                    : 'Se completa automáticamente al marcar la ubicación en el mapa.'
                }
              >
                <Input
                  id="comunidad"
                  value={form.comunidad}
                  placeholder="Ej. Comunidad El Roble"
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
                onChange={ubicarEnMapa}
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
                    onClick={() => cambiarPais(paisSugerido)}
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

            <FormErrors errores={erroresEnvio} title="No se pudo registrar el espacio" />
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
