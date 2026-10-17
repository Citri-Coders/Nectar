import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { cn } from '../lib/cn';
import { rolLabel, useAuth } from '../lib/auth';
import { applyTheme, initialTheme, type Theme } from '../lib/theme';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/segmentacion', label: 'Segmentación' },
  { to: '/especies', label: 'Especies' },
  { to: '/polinizadores', label: 'Polinizadores' },
  { to: '/espacios', label: 'Espacios' },
  { to: '/monitoreo', label: 'Monitoreo' },
  { to: '/ranking', label: 'Ranking' },
  { to: '/municipio', label: 'Municipio' },
  { to: '/sello', label: 'Sello' },
];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Néctar, ir al inicio">
      <span className="brand__mark" aria-hidden>
        🐝
      </span>
      <span>
        <span className="brand__name">Néctar</span>
        <span className="brand__tag">Red de polinizadores</span>
      </span>
    </Link>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => initialTheme());
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate('/');
  }

  // Sin sesión solo se muestra el inicio; los módulos requieren entrar.
  const enlaces = usuario ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.to === '/');

  return (
    <>
      <nav className="navbar">
        <div className="container navbar__inner">
          <Brand />

          <ul className={cn('nav-links', open && 'nav-links--open')}>
            {enlaces.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => cn('nav-link', isActive && 'nav-link--active')}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar__actions">
            {usuario ? (
              <div className="auth-chip">
                <span className={cn('auth-chip__rol', `auth-chip__rol--${usuario.rol}`)}>
                  {rolLabel(usuario.rol)}
                </span>
                <span className="auth-chip__name" title={usuario.username}>
                  {usuario.username}
                </span>
                <button type="button" className="auth-chip__logout" onClick={handleLogout}>
                  Salir
                </button>
              </div>
            ) : (
              <div className="auth-actions">
                <Link to="/login" className="btn btn--outlined btn--sm" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/registro" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </div>
            )}

            <button
              type="button"
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            >
              <span aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>

            <button
              type="button"
              className="nav-toggle"
              aria-expanded={open}
              aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="grid grid-4">
            <div>
              <Brand />
              <p className="text-subtle" style={{ marginTop: 'var(--space-4)', maxWidth: '34ch' }}>
                Plataforma abierta que une ciencia ciudadana, certificación municipal
                y financiamiento solidario para proteger a los polinizadores nativos.
              </p>
            </div>

            {usuario ? (
              <>
                <div>
                  <h4>Módulos</h4>
                  <ul className="stack stack-sm">
                    <li><Link to="/segmentacion">Plan personalizado</Link></li>
                    <li><Link to="/especies">Especies nativas</Link></li>
                    <li><Link to="/polinizadores">Polinizadores por municipio</Link></li>
                    <li><Link to="/monitoreo">Monitoreo de campo</Link></li>
                    <li><Link to="/municipio">Dashboard municipal</Link></li>
                  </ul>
                </div>

                <div>
                  <h4>Sello</h4>
                  <ul className="stack stack-sm">
                    <li><Link to="/sello">Productores certificados</Link></li>
                    <li><Link to="/sello">Verificar un QR</Link></li>
                    <li><Link to="/ranking">Ranking comunitario</Link></li>
                  </ul>
                </div>

                <div>
                  <h4>API</h4>
                  <ul className="stack stack-sm">
                    <li><span className="copy-hint">/api/v1/species</span></li>
                    <li><span className="copy-hint">/api/v1/spaces</span></li>
                    <li><span className="copy-hint">/api/v1/monitoring</span></li>
                    <li><span className="copy-hint">/api/v1/biodiversidad</span></li>
                    <li><span className="copy-hint">/api/v1/seal</span></li>
                  </ul>
                </div>
              </>
            ) : (
              <div>
                <h4>Acceso</h4>
                <ul className="stack stack-sm">
                  <li><Link to="/login">Iniciar sesión</Link></li>
                  <li><Link to="/registro">Crear una cuenta</Link></li>
                </ul>
                <p className="text-subtle" style={{ marginTop: 'var(--space-4)', maxWidth: '30ch' }}>
                  Inicia sesión para explorar los módulos de la plataforma.
                </p>
              </div>
            )}
          </div>

          <div className="footer__bottom">
            <span>© {new Date().getFullYear()} Néctar · Rally LatAm 2026</span>
            <span>Un modelo, mil paisajes. Una red, todo un continente.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
