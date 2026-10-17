import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth';
import { mensajesDeError, validarUsername } from '../lib/validation';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';
import { FormErrors } from '../components/ui/FormErrors';
import { Field, Input } from '../components/ui/Form';

export function Registro() {
  const { registro, autenticado } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  if (autenticado) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    // Validación local: se acumulan todos los mensajes de una vez.
    const nuevos: string[] = [];
    const errorUsuario = validarUsername(username);
    if (errorUsuario) nuevos.push(`Usuario: ${errorUsuario}`);

    if (password.length < 8 || password.length > 100) {
      nuevos.push('Contraseña: debe tener entre 8 y 100 caracteres.');
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      nuevos.push('Contraseña: debe combinar letras y números.');
    }
    if (password !== confirmacion) nuevos.push('Las contraseñas no coinciden.');

    if (nuevos.length > 0) {
      setErrores(nuevos);
      return;
    }

    setErrores([]);
    setSubmitting(true);
    try {
      await registro({ username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (error) {
      setErrores(mensajesDeError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Nueva cuenta"
        icon="🐝"
        title="Crear cuenta"
        description="Regístrate para registrar espacios y avistamientos de polinizadores en tu comunidad."
      />

      <Card tone="elevated" padding="lg" style={{ maxWidth: 520, margin: '0 auto' }}>
        <CardHead
          title="Datos de la cuenta"
          subtitle="El usuario solo puede tener letras, números, puntos, guiones y guion bajo."
        />

        <form className="stack stack-md" onSubmit={handleSubmit} noValidate>
          <Field label="Usuario" htmlFor="username" required>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              placeholder="Ej. maria.lopez"
              onChange={(event) => setUsername(event.target.value)}
            />
          </Field>

          <Field
            label="Contraseña"
            htmlFor="password"
            required
            hint="Mínimo 8 caracteres, combinando letras y números."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Field label="Repetir contraseña" htmlFor="confirmacion" required>
            <Input
              id="confirmacion"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              placeholder="••••••••"
              onChange={(event) => setConfirmacion(event.target.value)}
            />
          </Field>

          {errores.length > 0 ? <FormErrors errores={errores} title="No se pudo crear la cuenta" /> : null}

          <Button type="submit" block disabled={submitting} iconLeft="✨">
            {submitting ? 'Creando cuenta…' : 'Crear cuenta y entrar'}
          </Button>
        </form>

        <p className="text-muted" style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </Card>
    </>
  );
}
