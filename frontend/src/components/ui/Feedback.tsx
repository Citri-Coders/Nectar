import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('spinner', className)} role="status" aria-label="Cargando" />;
}

export function LoadingBlock({ label = 'Cargando datos…' }: { label?: string }) {
  return (
    <div className="loading-block">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '🐝', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden>
        {icon}
      </span>
      <p className="text-strong">{title}</p>
      {description ? <p className="text-subtle" style={{ maxWidth: '42ch' }}>{description}</p> : null}
      {action}
    </div>
  );
}

/** Bloque de error reutilizable para cualquier consulta a la API. */
export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="alert alert--danger" role="alert">
      <span className="alert__icon" aria-hidden>
        ⛔
      </span>
      <div className="alert__body">
        <p className="alert__title">No pudimos cargar la información</p>
        <p>{message}</p>
        {onRetry ? (
          <button type="button" className="btn btn--outlined btn--sm" style={{ marginTop: '0.75rem' }} onClick={onRetry}>
            Reintentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
