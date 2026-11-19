import { ReactNode, useState, KeyboardEvent } from 'react';
import { STATUS_COLORS, STATUS_LABELS, AppStatus } from '../lib/types';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const c = { error: 'bg-red-50 text-red-700 border-red-200', success: 'bg-green-50 text-green-700 border-green-200', info: 'bg-blue-50 text-blue-700 border-blue-200' }[kind];
  return <div className={`mb-4 rounded-lg border px-4 py-2 text-sm ${c}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">{children}</div>;
}

export function Spinner() {
  return <div className="p-10 text-center text-sm text-slate-500">Chargement…</div>;
}

export function StatusBadge({ status }: { status: AppStatus }) {
  return <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function ScoreBar({ label, value, weight }: { label: string; value: number; weight?: number }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex justify-between text-xs text-slate-600">
        <span>
          {label}
          {weight !== undefined && <span className="text-slate-400"> ({weight} %)</span>}
        </span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(2, value)}%` }} />
      </div>
    </div>
  );
}

export function ScoreCircle({ value }: { value: number }) {
  const color = value >= 75 ? 'bg-green-100 text-green-700' : value >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${color}`}>{value}</div>;
}

/** Saisie de tags (compétences) : Entrée ou virgule pour ajouter. */
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState('');
  const add = () => {
    const t = text.trim().replace(/,$/, '');
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
  };
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-300 bg-white p-2 focus-within:ring-2 focus-within:ring-brand-100">
      {value.map((v) => (
        <span key={v} className="badge flex items-center gap-1 bg-brand-100 text-brand-700">
          {v}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Retirer ${v}`}>
            ×
          </button>
        </span>
      ))}
      <input
        className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={placeholder || 'Ajouter… (Entrée)'}
      />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
