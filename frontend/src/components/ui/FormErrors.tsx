import { Alert } from './Alert';

export interface FormErrorsProps {
  /** Lista de mensajes de error de validación. */
  errores: string[];
  title?: string;
}

/**
 * Banner resumen de errores de un formulario: muestra todos los mensajes
 * (de validación local o de la API) en un solo bloque.
 */
export function FormErrors({ errores, title = 'Revisa los datos' }: FormErrorsProps) {
  if (errores.length === 0) return null;

  return (
    <Alert tone="danger" title={title}>
      {errores.length === 1 ? (
        <p>{errores[0]}</p>
      ) : (
        <ul
          style={{
            marginTop: 'var(--space-2)',
            paddingLeft: '1.2rem',
            listStyle: 'disc',
            display: 'grid',
            gap: 'var(--space-1)',
          }}
        >
          {errores.map((mensaje) => (
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}
