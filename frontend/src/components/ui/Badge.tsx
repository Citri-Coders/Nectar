import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'info'
  | 'solid'
  | 'outline';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: 'sm' | 'lg';
  className?: string;
  title?: string;
}

export function Badge({
  children,
  tone = 'neutral',
  size = 'sm',
  className,
  title,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'badge',
        tone !== 'neutral' && `badge--${tone}`,
        size === 'lg' && 'badge--lg',
        className
      )}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'plant';
  className?: string;
}) {
  return (
    <span className={cn('chip', variant === 'plant' && 'chip--plant', className)}>
      {children}
    </span>
  );
}
