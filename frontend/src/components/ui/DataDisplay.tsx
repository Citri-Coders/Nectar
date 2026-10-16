import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/format';

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'info';

export interface StatProps {
  icon?: string;
  label: string;
  value: number | string;
  tone?: Tone;
  hint?: string;
}

export function Stat({ icon, label, value, tone = 'primary', hint }: StatProps) {
  return (
    <div className="stat">
      {icon ? (
        <span className={cn('stat__icon', tone !== 'primary' && `stat__icon--${tone}`)} aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="stat__value">
        {typeof value === 'number' ? formatNumber(value) : value}
      </span>
      <span className="stat__label">{label}</span>
      {hint ? <span className="text-subtle">{hint}</span> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = 'primary',
  label,
}: {
  value: number;
  tone?: Tone;
  label?: string;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('progress__bar', tone !== 'primary' && `progress__bar--${tone}`)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function Meter({
  label,
  value,
  tone = 'primary',
  suffix = '%',
}: {
  label: string;
  value: number;
  tone?: Tone;
  suffix?: string;
}) {
  const rounded = Math.round(value * 10) / 10;
  return (
    <div className="meter">
      <div className="meter__head">
        <span className="meter__label">{label}</span>
        <span className="meter__value mono">
          {rounded}
          {suffix}
        </span>
      </div>
      <ProgressBar value={value} tone={tone} label={label} />
    </div>
  );
}
