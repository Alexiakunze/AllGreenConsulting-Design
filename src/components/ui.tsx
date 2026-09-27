import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ALL_GREEN_COLORS, COLOR_LABELS, resolveColor, type BrandPalette, type ColorToken } from '../design-system/designTokens';

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const v = {
    primary: 'bg-brand text-white hover:brightness-110 border border-brand',
    accent: 'bg-accent text-white hover:brightness-95 border border-accent',
    secondary: 'bg-panel text-ink border border-line-strong hover:bg-panel-2',
    ghost: 'bg-transparent text-ink border border-transparent hover:bg-black/5',
    danger: 'bg-panel text-danger border border-line-strong hover:bg-red-50',
  }[variant];
  const s = { sm: 'h-7 px-2.5 text-[12px] gap-1.5', md: 'h-8 px-3 text-[12.5px] gap-2', lg: 'h-11 px-5 text-[14px] gap-2' }[size];
  return (
    <button
      className={cx('inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40', v, s, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({ active, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cx(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-ink transition-colors hover:bg-black/5 disabled:opacity-30',
        active && 'bg-brand-soft text-brand',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Section({ title, children, actions, className }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cx('border-b border-line px-4 py-4', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="eyebrow">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-[11px] font-medium text-muted">{children}</span>;
}

export function TextInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
      className={cx('h-8 w-full rounded-md border border-line-strong bg-panel px-2.5 text-[12.5px] outline-none focus:border-brand', className)}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
      className={cx('w-full resize-y rounded-md border border-line-strong bg-panel px-2.5 py-2 text-[12.5px] leading-relaxed outline-none focus:border-brand', className)}
    />
  );
}

/** Numeric field with local draft (commits on blur/Enter or arrow keys) */
export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  precision = 0,
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  precision?: number;
}) {
  const fmt = (v: number) => (Number.isFinite(v) ? String(Math.round(v * 10 ** precision) / 10 ** precision) : '');
  const [draft, setDraft] = useState(fmt(value));
  useEffect(() => setDraft(fmt(value)), [value]);
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  const commit = (raw: string) => {
    const v = parseFloat(raw.replace(',', '.'));
    if (Number.isFinite(v)) onChange(clamp(v));
    else setDraft(fmt(value));
  };
  return (
    <label className="block min-w-0">
      {label && <Label>{label}</Label>}
      <div className="flex h-8 items-center rounded-md border border-line-strong bg-panel focus-within:border-brand">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const mult = e.shiftKey ? 10 : 1;
              const next = clamp(value + (e.key === 'ArrowUp' ? step : -step) * mult);
              onChange(Math.round(next * 10 ** precision) / 10 ** precision);
            }
          }}
          className="h-full w-full min-w-0 bg-transparent px-2 text-[12.5px] tabular-nums outline-none"
        />
        {suffix && <span className="pr-2 text-[11px] text-faint">{suffix}</span>}
      </div>
    </label>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, format }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className="text-[11px] tabular-nums text-ink">{format ? format(value) : value}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

export function Select<T extends string>({ label, value, onChange, options, className }: { label?: string; value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; className?: string }) {
  return (
    <label className={cx('block min-w-0', className)}>
      {label && <Label>{label}</Label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 w-full rounded-md border border-line-strong bg-panel px-2 text-[12.5px] outline-none focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: ReactNode; title?: string }> }) {
  return (
    <div className="flex h-8 rounded-md border border-line-strong bg-panel-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx('flex flex-1 items-center justify-center rounded-[5px] text-[12px] transition-colors', value === o.value ? 'bg-panel text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="text-[12.5px]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cx('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line-strong')}
      >
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </button>
    </label>
  );
}

const SWATCH_TOKENS: ColorToken[] = ['primary', 'secondary', 'dark', 'light', 'white', 'sand', 'muted'];

/** Color picker: brand tokens first, custom color as the exception */
export function ColorField({ label, value, onChange, palette, allowTransparent = true }: { label?: string; value: string; onChange: (v: string) => void; palette: BrandPalette; allowTransparent?: boolean }) {
  const resolved = resolveColor(value, palette);
  const isToken = value.startsWith('token:');
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCH_TOKENS.map((t) => (
          <button
            key={t}
            title={COLOR_LABELS[t]}
            onClick={() => onChange(`token:${t}`)}
            className={cx('h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110', value === `token:${t}` && 'ring-2 ring-selection ring-offset-1')}
            style={{ background: palette[t] ?? ALL_GREEN_COLORS[t] }}
          />
        ))}
        {allowTransparent && (
          <button
            title="Transparente"
            onClick={() => onChange('transparent')}
            className={cx('relative h-6 w-6 overflow-hidden rounded-full border border-black/15 bg-white', value === 'transparent' && 'ring-2 ring-selection ring-offset-1')}
          >
            <span className="absolute left-1/2 top-[-2px] h-[28px] w-[1.5px] -translate-x-1/2 rotate-45 bg-danger" />
          </button>
        )}
        <label title="Cor personalizada (fora da paleta)" className={cx('relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-dashed border-line-strong', !isToken && value !== 'transparent' && 'ring-2 ring-selection ring-offset-1')}>
          <span className="absolute inset-0 flex items-center justify-center text-[12px] text-muted">+</span>
          <input type="color" value={resolved.startsWith('#') ? resolved.slice(0, 7) : '#000000'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0" />
        </label>
      </div>
    </div>
  );
}

export function Modal({ children, onClose, className }: { children: ReactNode; onClose: () => void; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1a18]/60 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={cx('max-h-full overflow-auto rounded-xl bg-panel shadow-2xl', className)} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
