import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** variant visual */
  tone?: 'surface' | 'elevated' | 'accent' | 'inverse';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section' | 'li';
}

export function Card({
  children,
  className,
  style,
  tone = 'surface',
  interactive = false,
  padding = 'md',
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      style={style}
      className={cn(
        'card',
        tone === 'elevated' && 'card--elevated',
        tone === 'accent' && 'card--accent',
        tone === 'inverse' && 'card--inverse',
        interactive && 'card--interactive',
        padding === 'none' && 'card--pad-none',
        padding === 'sm' && 'card--pad-sm',
        padding === 'lg' && 'card--pad-lg',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export interface CardHeadProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function CardHead({ title, subtitle, action }: CardHeadProps) {
  return (
    <header className="card__head">
      <div>
        <h3 className="card__title">{title}</h3>
        {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="row gap-2">{action}</div> : null}
    </header>
  );
}

export function CardDivider() {
  return <hr className="card__divider" />;
}
