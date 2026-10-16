import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outlined'
  | 'inverted'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export function btnClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  block = false
): string {
  return cn(
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block'
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  iconLeft,
  iconRight,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(btnClass(variant, size, block), className)} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

export interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children: ReactNode;
  target?: string;
}

/** Enlace con apariencia de botón (usa el router). */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  block = false,
  iconLeft,
  iconRight,
  className,
  children,
  target,
}: ButtonLinkProps) {
  const isExternal = /^(https?:)?\/\//.test(to);

  if (isExternal) {
    return (
      <a
        href={to}
        target={target ?? '_blank'}
        rel="noreferrer"
        className={cn(btnClass(variant, size, block), className)}
      >
        {iconLeft}
        {children}
        {iconRight}
      </a>
    );
  }

  return (
    <Link to={to} className={cn(btnClass(variant, size, block), className)}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
