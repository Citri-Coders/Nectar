import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const DEFAULT_ICON: Record<NonNullable<AlertProps['tone']>, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '⛔',
};

export function Alert({ tone = 'info', title, children, icon, className }: AlertProps) {
  return (
    <div className={cn('alert', `alert--${tone}`, className)} role="status">
      <span className="alert__icon" aria-hidden>
        {icon ?? DEFAULT_ICON[tone]}
      </span>
      <div className="alert__body">
        {title ? <p className="alert__title">{title}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
    </div>
  );
}
