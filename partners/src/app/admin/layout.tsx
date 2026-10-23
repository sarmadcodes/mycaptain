import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/shell';

export const metadata: Metadata = { title: { default: 'Operations', template: '%s | My Captain Operations' }, robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
