import type { Metadata } from 'next';

import { DashboardShell } from '@/components/dash/shell';

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s | My Captain Partners' }, robots: { index: false } };

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  return <DashboardShell>{children}</DashboardShell>;
}
