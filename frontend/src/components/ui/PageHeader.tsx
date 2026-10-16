import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, icon }: PageHeaderProps) {
  return (
    <header className="row-between row-wrap" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
      <div className="stack stack-sm" style={{ maxWidth: '62ch' }}>
        {eyebrow ? (
          <span className="eyebrow">
            {icon ? <span aria-hidden>{icon}</span> : null}
            {eyebrow}
          </span>
        ) : null}
        <h1 className="title-xl">{title}</h1>
        {description ? <p className="text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="row row-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export interface StepperProps {
  steps: string[];
  current: number;
  onGoTo?: (index: number) => void;
}

export function Stepper({ steps, current, onGoTo }: StepperProps) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;
        return (
          <li key={step} className="row gap-2" style={{ flex: '1 1 auto' }}>
            <button
              type="button"
              className={cn('step', isActive && 'step--active', isDone && 'step--done')}
              onClick={onGoTo && isDone ? () => onGoTo(index) : undefined}
              disabled={!onGoTo || !isDone}
              style={{ cursor: isDone && onGoTo ? 'pointer' : 'default' }}
            >
              <span className="step__dot">{isDone ? '✓' : index + 1}</span>
              <span>{step}</span>
            </button>
            {index < steps.length - 1 ? <span className="step__seam" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
