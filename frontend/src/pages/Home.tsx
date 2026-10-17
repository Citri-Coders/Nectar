import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../lib/auth';
import { ButtonLink } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingBlock, ErrorBlock } from '../components/ui/Feedback';
import { formatNumber } from '../lib/format';

const MODULES = [
  {
    icon: '🧭',
    title: 'Néctar Diseño',
    tone: 'badge--primary' as const,
    description: 'Guía de diseño de paisaje, biblioteca de especies nativas y cálculo de conectividad.',
    to: '/especies',
    cta: 'Ver especies',
  },
  {
    icon: '🌱',
    title: 'Néctar Ciudadano',
    tone: 'badge--secondary' as const,
    description: 'Segmentación personalizada, plan de acción, registro de prácticas y monitoreo con puntos.',
    to: '/segmentacion',
    cta: 'Crear mi plan',
  },
  {
    icon: '🏛️',
    title: 'Néctar Municipio',
    tone: 'badge--tertiary' as const,
    description: 'Dashboard con KPIs, ranking de comunidades, conectividad de microcuenca y mapa territorial.',
    to: '/municipio',
    cta: 'Abrir dashboard',
  },
  {
    icon: '🏅',
    title: 'Néctar Sello',
    tone: 'badge--primary' as const,
    description: 'Sello “Polinizador Amigo”, trazabilidad por QR y adopción de metros de hábitat floral.',
    to: '/sello',
    cta: 'Ver productores',
  },
  {
    icon: '🌎',
    title: 'Néctar Red',
    tone: 'badge--secondary' as const,
    description: 'Comparte datos y estándares entre nodos regionales para replicar el modelo.',
    to: '/ranking',
    cta: 'Ver ranking',
  },
];

const PASOS = [
  {
    n: 1,
    title: 'Diseñamos el paisaje',
    text: 'El formulario de segmentación evalúa país, tipo de espacio, cultivo y piso climático para recomendar polinizadores, plantas nativas y tipo de nido.',
  },
  {
    n: 2,
    title: 'Monitoreamos la biodiversidad',
    text: 'Cada avistamiento de campo suma +15 puntos, actualiza la insignia del espacio y alimenta el ranking comunitario.',
  },
  {
    n: 3,
    title: 'Certificamos y financiamos',
    text: 'Las fincas con prácticas verificadas obtienen el Sello Polinizador Amigo; consumidores y empresas adoptan m² de hábitat.',
  },
];

export function Home() {
  const { autenticado } = useAuth();
  const { data, loading, error, reload } = useApi(async () => {
    const [species, producers, leaderboard] = await Promise.all([
      api.getSpecies(),
      api.getProducers(),
      api.getLeaderboard(),
    ]);
    return { species, producers, leaderboard };
  }, []);

  const espacios = data?.leaderboard.total ?? null;
  const certificados = data?.producers.total ?? null;
  const paises = data?.species.total ?? null;

  // Sin sesión, los accesos llevan al login y vuelven al módulo tras entrar.
  const destino = (ruta: string) => (autenticado ? ruta : '/login');
  const destinoEstado = (ruta: string) =>
    autenticado ? undefined : { from: ruta, mensaje: 'Inicia sesión para continuar.' };

  return (
    <div className="stack stack-lg">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="hero animate-in">
        <div className="hero__content">
          








































          
          <h1 className="display" style={{ marginTop: 'var(--space-4)' }}>
            Un modelo, mil paisajes.
          </h1>
          <p className="hero__lead">
            Néctar conecta comunidades, productores y municipios para conservar los
            polinizadores nativos y la agroecología en Latinoamérica. Diseñamos, monitoreamos,
            certificamos y financiamos hábitats florales.
          </p>
          <div className="hero__actions">
            <ButtonLink
              to={destino('/segmentacion')}
              state={destinoEstado('/segmentacion')}
              variant="tertiary"
              size="lg"
              iconLeft="🌼"
            >
              {autenticado ? 'Crear mi plan de paisaje' : 'Inicia sesión para comenzar'}
            </ButtonLink>
            <ButtonLink
              to={destino('/municipio')}
              state={destinoEstado('/municipio')}
              variant="outlined"
              size="lg"
            >
              Dashboard municipal
            </ButtonLink>
          </div>
        </div>

        <div className="hero__stats">
          <div>
            <div className="hero__stat-value">
              {loading ? '—' : formatNumber(espacios ?? 0)}
            </div>
            <div className="hero__stat-label">Espacios registrados</div>
          </div>
          <div>
            <div className="hero__stat-value">
              {loading ? '—' : formatNumber(certificados ?? 0)}
            </div>
            <div className="hero__stat-label">Fincas certificadas</div>
          </div>
          <div>
            <div className="hero__stat-value">{loading ? '—' : formatNumber(paises ?? 0)}</div>
            <div className="hero__stat-label">Países con especies nativas</div>
          </div>
          <div>
            <div className="hero__stat-value">5</div>
            <div className="hero__stat-label">Módulos replicables</div>
          </div>
        </div>
      </section>

      {loading ? <LoadingBlock label="Conectando con la API Néctar…" /> : null}
      {error ? <ErrorBlock message={error} onRetry={reload} /> : null}

      {/* ------------------------------------------------------------- Módulos */}
      <section>
        <div className="row-between row-wrap" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <span className="eyebrow" aria-hidden>🧩</span>
            <h2 className="title-lg" style={{ marginTop: 'var(--space-2)' }}>
              Cinco módulos, una sola red
            </h2>
          </div>
          <p className="text-muted" style={{ maxWidth: '46ch' }}>
            No es solo una app: es un método modular replicable que se adapta al piso climático,
            las especies locales y el marco legal de cada región.
          </p>
        </div>

        <div className="grid grid-3">
          {MODULES.map((module) => (
            <Card key={module.title} tone="elevated" interactive as="article">
              <span className={`badge ${module.tone} badge--lg`} aria-hidden>
                {module.icon}
              </span>
              <h3 className="title-sm" style={{ marginTop: 'var(--space-4)' }}>
                {module.title}
              </h3>
              <p className="text-muted" style={{ marginTop: 'var(--space-2)' }}>
                {module.description}
              </p>
              <div style={{ marginTop: 'var(--space-5)' }}>
                <ButtonLink
                  to={destino(module.to)}
                  state={destinoEstado(module.to)}
                  variant="ghost"
                  size="sm"
                  iconRight="→"
                >
                  {module.cta}
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- Cómo funciona */}
      <section className="grid grid-2" style={{ alignItems: 'start' }}>
        <Card tone="elevated" padding="lg">
          <CardHead
            title="Cómo funciona"
            subtitle="De la idea al sello verificable en tres pasos"
          />
          <div className="timeline">
            {PASOS.map((paso) => (
              <div className="timeline__item" key={paso.n}>
                <span className="timeline__dot">{paso.n}</span>
                <div className="timeline__text">
                  <p className="text-strong">{paso.title}</p>
                  <p className="text-muted">{paso.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="stack stack-md">
          <Card tone="accent" padding="lg">
            <h2 className="title-md">Empieza en 4 preguntas</h2>
            <p style={{ marginTop: 'var(--space-3)' }}>
              Ubicación, tipo de espacio, cultivo y clima. Con eso la API genera el plan
              personalizado: polinizador principal, plantas nativas, nido sugerido y puntos
              de bienvenida.
            </p>
            <div style={{ marginTop: 'var(--space-6)' }} className="row row-wrap gap-3">
              <ButtonLink
                to={destino('/segmentacion')}
                state={destinoEstado('/segmentacion')}
                variant="tertiary"
              >
                {autenticado ? 'Generar plan personalizado' : 'Inicia sesión para generar tu plan'}
              </ButtonLink>
            </div>
          </Card>

          <Card tone="elevated">
            <CardHead title="Datos abiertos" subtitle="Consume la misma API que esta interfaz" />
            <div className="tag-list">
              <Badge tone="primary">GET /species</Badge>
              <Badge tone="secondary">POST /spaces/segmentation</Badge>
              <Badge tone="tertiary">POST /monitoring</Badge>
              <Badge tone="primary">GET /gamification/leaderboard</Badge>
              <Badge tone="secondary">GET /municipio/dashboard/:m</Badge>
              <Badge tone="tertiary">GET /seal/verify/:slug</Badge>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
