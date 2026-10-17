import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../lib/auth';
import { LoadingBlock } from './ui/Feedback';

/**
 * Guard de rutas: solo deja pasar a los módulos si hay sesión iniciada.
 * - Mientras se valida el token guardado, muestra un estado de carga.
 * - Sin sesión, redirige a /login conservando el destino para volver tras entrar.
 */
export function RequireAuth() {
  const { autenticado, cargandoSesion } = useAuth();
  const location = useLocation();

  if (cargandoSesion) {
    return <LoadingBlock label="Verificando tu sesión…" />;
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          mensaje: 'Inicia sesión para continuar.',
        }}
      />
    );
  }

  return <Outlet />;
}
