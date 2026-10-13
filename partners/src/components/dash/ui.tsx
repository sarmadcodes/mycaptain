'use client';

import { CloudSlashIcon, XIcon, type Icon } from '@phosphor-icons/react';
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { messageOf } from '@/lib/api';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';
const tones: Record<Tone, string> = {
  blue: 'bg-pale text-blue',
  green: 'bg-success/12 text-success',
  amber: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  red: 'bg-danger/12 text-danger',
  neutral: 'bg-surface text-muted',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean };
const variants = {
  primary: 'bg-blue text-white hover:bg-blue-hover',
  secondary: 'border border-line bg-elevated hover:bg-surface',
  ghost: 'text-blue hover:bg-pale',
  danger: 'bg-danger text-white hover:opacity-90',
};

export function Button({ variant = 'primary', loading, className = '', children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-elevated p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function PageHeader({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {body ? <p className="text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-line px-6 py-12 text-center">
      <CloudSlashIcon size={32} className="text-faint" />
      <p className="font-semibold">Could not load this</p>
      <p className="max-w-sm text-sm text-muted">{messageOf(error)}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Empty({ icon: I, title, body, action }: { icon: Icon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-pale text-blue">
        <I size={24} />
      </span>
      <p className="font-semibold">{title}</p>
      {body ? <p className="max-w-sm text-sm text-muted">{body}</p> : null}
      {action}
    </div>
  );
}

export function FormError({ error }: { error?: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
      {typeof error === 'string' ? error : messageOf(error)}
    </p>
  );
}

// Accessible modal built on <dialog>.
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(520px,calc(100vw-2rem))] rounded-2xl border border-line bg-elevated p-0 text-ink backdrop:bg-black/40">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-surface hover:text-ink">
          <XIcon size={20} />
        </button>
      </div>
      <div className="max-h-[75dvh] overflow-y-auto px-6 py-5">{open ? children : null}</div>
    </dialog>
  );
}

export const statusTone: Record<string, Tone> = {
  pending_payment: 'amber',
  paid: 'blue',
  assigning: 'amber',
  confirmed: 'blue',
  arriving: 'blue',
  on_duty: 'green',
  completed: 'neutral',
  closed: 'neutral',
  cancelled: 'red',
};

export const statusLabel: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  assigning: 'Needs staff',
  confirmed: 'Confirmed',
  arriving: 'On the way',
  on_duty: 'On duty',
  completed: 'Completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
};
