'use client';

import {
  BuildingsIcon,
  CalendarCheckIcon,
  CarIcon,
  FilesIcon,
  HouseIcon,
  SignOutIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { Logo } from '@/components/logo';
import { api } from '@/lib/api';
import { connectLive } from '@/lib/live';

import { useCompany } from './hooks';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: HouseIcon },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarCheckIcon },
  { href: '/dashboard/staff', label: 'Staff', icon: UsersThreeIcon },
  { href: '/dashboard/fleet', label: 'Fleet', icon: CarIcon, rentalsOnly: true },
  { href: '/dashboard/documents', label: 'Documents', icon: FilesIcon },
  { href: '/dashboard/company', label: 'Company', icon: BuildingsIcon },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } }));
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
  const { data } = useCompany();
  const company = data?.company;
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

  const nav = NAV.filter((n) => !n.rentalsOnly || company?.services.includes('rentals'));
  const active = (href: string) => (href === '/dashboard' ? path === href : path.startsWith(href));

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-line px-4 py-6 lg:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>
        <div className="mt-8 px-2">
          <p className="truncate text-sm font-semibold">{company ? company.tradingName || company.legalName : ' '}</p>
          <p className="text-xs text-faint">{company?.ref ?? ' '}</p>
        </div>
        <nav className="mt-6 flex-1 space-y-1" aria-label="Dashboard">
          {nav.map(({ href, label, icon: I }) => (
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
        {/* Phones and tablets: top bar with scrollable tabs */}
        <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/dashboard">
              <Logo />
            </Link>
            <button type="button" onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 text-muted hover:bg-surface">
              <SignOutIcon size={20} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Dashboard">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${active(href) ? 'bg-pale text-blue' : 'text-muted'}`}>
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {company && company.status !== 'approved' ? <StatusBanner status={company.status} note={company.reviewNote} /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function StatusBanner({ status, note }: { status: string; note?: string }) {
  const copy: Record<string, { title: string; body: string }> = {
    pending: { title: 'Your application is under review', body: 'We verify documents within 3 to 5 working days. You can add staff once approved.' },
    changes_requested: { title: 'Changes requested', body: note ?? 'Update your documents and we will review again.' },
    rejected: { title: 'Application not approved', body: note ?? 'Contact partners@mycaptain.pk for details.' },
    suspended: { title: 'Your company is suspended', body: note ?? 'Contact partners@mycaptain.pk to resolve this.' },
  };
  const c = copy[status];
  if (!c) return null;
  return (
    <div role="status" className="mb-8 flex gap-3 rounded-2xl border border-line bg-pale p-4">
      <WarningCircleIcon size={22} className="mt-0.5 shrink-0 text-blue" />
      <div className="space-y-1">
        <p className="font-semibold">{c.title}</p>
        <p className="text-sm text-muted">{c.body}</p>
        {status === 'changes_requested' ? (
          <Link href="/dashboard/documents" className="text-sm font-semibold text-blue hover:underline">
            Update documents
          </Link>
        ) : null}
      </div>
    </div>
  );
}
