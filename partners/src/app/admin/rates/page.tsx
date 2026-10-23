'use client';

import { useState } from 'react';

import { useRates, useSaveRates, type Rates } from '@/components/admin/hooks';
import { Button, Card, ErrorState, FormError, PageHeader, Skeleton } from '@/components/dash/ui';

const FIELDS: { label: string; unit: string; get: (r: Rates) => number; set: (r: Rates, v: number) => Rates }[] = [
  { label: 'Driver, small car', unit: 'PKR per hour', get: (r) => r.driverHourly.small, set: (r, v) => ({ ...r, driverHourly: { ...r.driverHourly, small: v } }) },
  { label: 'Driver, sedan', unit: 'PKR per hour', get: (r) => r.driverHourly.sedan, set: (r, v) => ({ ...r, driverHourly: { ...r.driverHourly, sedan: v } }) },
  { label: 'Driver, SUV', unit: 'PKR per hour', get: (r) => r.driverHourly.suv, set: (r, v) => ({ ...r, driverHourly: { ...r.driverHourly, suv: v } }) },
  { label: 'Driver, luxury', unit: 'PKR per hour', get: (r) => r.driverHourly.luxury, set: (r, v) => ({ ...r, driverHourly: { ...r.driverHourly, luxury: v } }) },
  { label: 'Security guard (bouncer)', unit: 'PKR per hour', get: (r) => r.guardHourly, set: (r, v) => ({ ...r, guardHourly: v }) },
  { label: 'Armed gunman', unit: 'PKR per hour', get: (r) => r.gunmanHourly, set: (r, v) => ({ ...r, gunmanHourly: v }) },
  { label: 'Platform fee', unit: 'percent', get: (r) => r.feePercent, set: (r, v) => ({ ...r, feePercent: v }) },
  { label: 'Rental minimum', unit: 'hours', get: (r) => r.rentalMinHours, set: (r, v) => ({ ...r, rentalMinHours: v }) },
];

export default function AdminRates() {
  const { data, isLoading, error, refetch } = useRates();
  if (isLoading) return <Skeleton rows={3} />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;
  return <RateForm initial={data.rates} />;
}

function RateForm({ initial }: { initial: Rates }) {
  const save = useSaveRates();
  const [rates, setRates] = useState(initial);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Rates" body="New quotes use these prices immediately. Existing bookings keep the price they were booked at." />
      <Card>
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(rates, { onSuccess: () => setSaved(true) });
          }}>
          {FIELDS.map((f) => (
            <label key={f.label} className="space-y-1.5 text-sm">
              <span className="block font-medium">{f.label}</span>
              <div className="flex items-center gap-2">
                <input
                  inputMode="numeric"
                  value={String(f.get(rates))}
                  onChange={(e) => {
                    setSaved(false);
                    setRates((r) => f.set(r, Number(e.target.value.replace(/[^\d.]/g, '')) || 0));
                  }}
                  className="h-12 w-full rounded-xl border border-line bg-surface px-3"
                />
                <span className="w-28 shrink-0 text-xs text-muted">{f.unit}</span>
              </div>
            </label>
          ))}
          <div className="space-y-3 sm:col-span-2">
            <FormError error={save.error} />
            <Button type="submit" loading={save.isPending}>
              {saved ? 'Saved' : 'Save rates'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
