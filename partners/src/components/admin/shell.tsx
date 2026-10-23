'use client';

import {
  BuildingsIcon,
  CalendarCheckIcon,
  ChatCircleTextIcon,
  CurrencyCircleDollarIcon,
  GaugeIcon,
  SignOutIcon,
  TagIcon,
} from '@phosphor-icons/react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { Logo } from '@/components/logo';
import { api } from '@/lib/api';
import { connectLive } from '@/lib/live';

const NAV = [
  { href: '/admin', label: 'Overview', icon: GaugeIcon },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheckIcon },
  { href: '/admin/partners', label: 'Partners', icon: BuildingsIcon },
  { href: '/admin/cases', label: 'Cases', icon: ChatCircleTextIcon },
  { href: '/admin/payouts', label: 'Payouts', icon: CurrencyCircleDollarIcon },
  { href: '/admin/rates', label: 'Rates', icon: TagIcon },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } }));
  return (
    <QueryClientProvider client={qc}>
      <Frame>{children}</Frame>
    </QueryClientProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const path = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let socket: Awaited<ReturnType<typeof connectLive>> = null;
    let cancelled = false;
    connectLive(qc).then((s) => (cancelled ? s?.disconnect() : (socket = s)));
    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [qc]);

  const signOut = async () => {
    setSigningOut(true);
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    qc.clear();
    router.replace('/sign-in');
    router.refresh();
  };
  const active = (href: string) => (href === '/admin' ? path === href : path.startsWith(href));

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-line px-4 py-6 lg:flex">
        <Link href="/admin" className="px-2">
          <Logo />
        </Link>
        <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-faint">Operations</p>
        <nav className="mt-3 flex-1 space-y-1" aria-label="Admin">
          {NAV.map(({ href, label, icon: I }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active(href) ? 'bg-pale text-blue' : 'text-muted hover:bg-surface hover:text-ink'
              }`}>
              <I size={20} weight={active(href) ? 'fill' : 'regular'} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface hover:text-ink">
          <SignOutIcon size={20} />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo />
            <button type="button" onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-muted hover:bg-surface">
              <SignOutIcon size={20} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${active(href) ? 'bg-pale text-blue' : 'text-muted'}`}>
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
