import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import type { CatalogOption } from '../../lib/catalog';

/* -------------------------------------------------------------------------- */
/* Field wrapper                                                              */
/* -------------------------------------------------------------------------- */

export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('field', className)}>
      {label ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="field__required">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <span className="field__error">{error}</span> : null}
      {!error && hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controles base                                                             */
/* -------------------------------------------------------------------------- */

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn('input', className)} {...rest} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn('textarea', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn('select', className)} {...rest}>
        {children}
      </select>
    );
  }
);

/* -------------------------------------------------------------------------- */
/* Tarjetas de opción (segmentación)                                          */
/* -------------------------------------------------------------------------- */

export function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: CatalogOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn('option-card', selected && 'option-card--active')}
      aria-pressed={selected}
      onClick={() => onSelect(option.value)}
    >
      {option.icon ? (
        <span className="option-card__icon" aria-hidden>
          {option.icon}
        </span>
      ) : null}
      <span className="option-card__label">{option.label}</span>
      {option.desc ? <span className="option-card__desc">{option.desc}</span> : null}
    </button>
  );
}

export function OptionGrid({
  options,
  value,
  onChange,
  columns = 'auto',
}: {
  options: CatalogOption[];
  value: string | null;
  onChange: (value: string) => void;
  columns?: 'auto' | 'sm';
}) {
  return (
    <div className={cn('grid', columns === 'auto' ? 'grid-auto' : 'grid-auto-sm')}>
      {options.map((option) => (
        <OptionCard
          key={option.value}
          option={option}
          selected={value === option.value}
          onSelect={onChange}
        />
      ))}
    </div>
  );
}

export function CheckOption({
  label,
  icon,
  checked,
  onChange,
  name,
}: {
  label: string;
  icon?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        {icon ? <span aria-hidden>{icon} </span> : null}
        {label}
      </span>
    </label>
  );
}
