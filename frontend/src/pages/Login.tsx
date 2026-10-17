import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { ROLES_SISTEMA, useAuth } from '../lib/auth';
import { mensajesDeError } from '../lib/validation';
import type { Rol } from '../lib/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { FormErrors } from '../components/ui/FormErrors';
import { Field, Input, Select } from '../components/ui/Form';

export function Login() {
  const { login, autenticado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estado = location.state as { from?: string; mensaje?: string } | null;
  const desde = estado?.from ?? '/';

  const [rol, setRol] = useState<Rol>('usuario');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  // Si ya hay sesión, se redirige al destino solicitado.
  if (autenticado) return <Navigate to={desde} replace />;

  const esRolMaestro = rol !== 'usuario';
  const descripcionRol = ROLES_SISTEMA.find((item) => item.value === rol)?.descripcion;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Validación local: se acumulan todos los mensajes de una vez.
    const nuevos: string[] = [];
    if (!esRolMaestro && !username.trim()) nuevos.push('Escribe tu usuario.');
    if (!password) nuevos.push('Escribe tu contraseña.');

    if (nuevos.length > 0) {
      setErrores(nuevos);
      return;
    }

    setErrores([]);
    setSubmitting(true);
    try {
      await login({
        rol,
        password,
        ...(esRolMaestro ? {} : { username: username.trim() }),
      });
      navigate(desde, { replace: true });
    } catch (error) {
      setErrores(mensajesDeError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Acceso"
        icon="🔐"
        title="Iniciar sesión"
        description="Ingresa con tu cuenta de usuario o con las credenciales maestras de administrador y auditor."
      />

      <Card tone="elevated" padding="lg" style={{ maxWidth: 520, margin: '0 auto' }}>
        <CardHead title="Datos de acceso" subtitle={descripcionRol} />

        {estado?.mensaje ? (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <Alert tone="info" title="Acceso requerido">
              {estado.mensaje}
            </Alert>
          </div>
        ) : null}

        <form className="stack stack-md" onSubmit={handleSubmit} noValidate>
          <Field label="Rol" htmlFor="rol" required hint="Elige cómo quieres entrar.">
            <Select
              id="rol"
              value={rol}
              onChange={(event) => {
                setRol(event.target.value as Rol);
                setErrores([]);
              }}
            >
              {ROLES_SISTEMA.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          {esRolMaestro ? (
            <Alert tone="warning" title="Credenciales maestras">
              El administrador y el auditor entran con la contraseña maestra, sin necesidad
              de usuario registrado.
            </Alert>
          ) : (
            <Field label="Usuario" htmlFor="username" required>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                placeholder="Tu nombre de usuario"
                onChange={(event) => setUsername(event.target.value)}
              />
            </Field>
          )}

          <Field label="Contraseña" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete={esRolMaestro ? 'off' : 'current-password'}
              value={password}
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <FormErrors errores={errores} title="No se pudo iniciar sesión" />

          <Button type="submit" block disabled={submitting} iconLeft="🔐">
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-muted" style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          ¿No tienes cuenta? <Link to="/registro">Crear una cuenta</Link>
        </p>
      </Card>
    </>
  );
}
