import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  api,
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from './api';
import type { LoginInput, RegistroInput, Rol, Usuario } from './types';

interface AuthContextValue {
  /** Usuario de la sesión actual, o null si nadie ha iniciado sesión. */
  usuario: Usuario | null;
  autenticado: boolean;
  /** true mientras se valida contra el servidor el token guardado. */
  cargandoSesion: boolean;
  /** true si el usuario puede ingresar datos (usuario o administrador). */
  puedeEscribir: boolean;
  /** true únicamente para el rol administrador. */
  esAdministrador: boolean;
  login: (input: LoginInput) => Promise<Usuario>;
  registro: (input: RegistroInput) => Promise<Usuario>;
  logout: () => Promise<void>;
  hasRole: (...roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Se hidrata desde localStorage para que la sesión sobreviva a un recargue.
  const [usuario, setUsuario] = useState<Usuario | null>(() =>
    getToken() ? getStoredUser() : null
  );
  // Si hay token guardado, hay que confirmarlo con el servidor antes de dejar pasar.
  const [cargandoSesion, setCargandoSesion] = useState<boolean>(() => Boolean(getToken()));

  // Si la API responde 401 (token inválido), se refleja el cierre de sesión.
  useEffect(() => {
    function cerrar() {
      setUsuario(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, cerrar);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, cerrar);
  }, []);

  // Valida la sesión guardada contra el servidor al arrancar.
  useEffect(() => {
    if (!getToken()) {
      setCargandoSesion(false);
      return;
    }

    let active = true;

    api
      .me()
      .then(({ usuario: actual }) => {
        if (active) setUsuario(actual);
      })
      .catch((error: unknown) => {
        if (active && error instanceof ApiError && error.status === 401) {
          clearSession();
          setUsuario(null);
        }
      })
      .finally(() => {
        if (active) setCargandoSesion(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const sesion = await api.login(input);
    saveSession(sesion);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const registro = useCallback(async (input: RegistroInput) => {
    const sesion = await api.registro(input);
    saveSession(sesion);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* aunque falle en el servidor, se cierra la sesión local */
    }
    clearSession();
    setUsuario(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Rol[]) => Boolean(usuario && roles.includes(usuario.rol)),
    [usuario]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      autenticado: Boolean(usuario),
      cargandoSesion,
      puedeEscribir: Boolean(usuario) && usuario?.rol !== 'auditor',
      esAdministrador: usuario?.rol === 'administrador',
      login,
      registro,
      logout,
      hasRole,
    }),
    [usuario, cargandoSesion, login, registro, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook de acceso a la sesión. Debe usarse dentro de <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}

/** Roles disponibles para el login, con su descripción. */
export const ROLES_SISTEMA: { value: Rol; label: string; descripcion: string }[] = [
  { value: 'usuario', label: 'Usuario', descripcion: 'Registra espacios y avistamientos.' },
  {
    value: 'administrador',
    label: 'Administrador',
    descripcion: 'Credenciales maestras · puede eliminar datos.',
  },
  {
    value: 'auditor',
    label: 'Auditor',
    descripcion: 'Credenciales maestras · solo consulta y revisa.',
  },
];

/** Nombre legible del rol. */
export function rolLabel(rol: Rol): string {
  return ROLES_SISTEMA.find((item) => item.value === rol)?.label ?? rol;
}
