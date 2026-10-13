'use client';

import { CarIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { pkr } from '@/components/dash/format';
import { useCars, useCompany, useSaveCar } from '@/components/dash/hooks';
import { Badge, Button, Card, Dialog, Empty, ErrorState, FormError, PageHeader, Skeleton } from '@/components/dash/ui';
import { Input, Select } from '@/components/register/fields';
import type { Car } from '@/lib/types';

const CLASSES = [
  { value: 'small', label: 'Economy' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxury', label: 'Luxury' },
];

export default function FleetPage() {
  const company = useCompany();
  const { data, isLoading, error, refetch } = useCars();
  const save = useSaveCar();
  const [editing, setEditing] = useState<Partial<Car> | null>(null);
  const offersRentals = company.data?.company.services.includes('rentals');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet"
        body="Cars customers can rent with one of your drivers. Day rates cover 8 hours."
        action={
          offersRentals ? (
            <Button onClick={() => setEditing({ class: 'sedan', transmission: 'automatic', seats: 4 })}>
              <PlusIcon size={18} weight="bold" /> Add car
            </Button>
          ) : null
        }
      />
      {!offersRentals && !company.isLoading ? (
        <Empty icon={CarIcon} title="Rentals are not part of your services" body="Contact partners@mycaptain.pk to add car rentals with driver." />
      ) : isLoading ? (
        <Skeleton rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data?.cars.length ? (
        <Empty icon={CarIcon} title="No cars listed" body="Add your first car to start receiving rental bookings." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.cars.map((c) => (
            <Card key={c.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted">
                    {CLASSES.find((k) => k.value === c.class)?.label}, {c.seats} seats, {c.transmission}
                  </p>
                </div>
                <Badge tone={c.active ? 'green' : 'neutral'}>{c.active ? 'Listed' : 'Hidden'}</Badge>
              </div>
              <p className="text-lg font-bold">
                {pkr(c.perDay)} <span className="text-sm font-normal text-muted">per day</span>
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-9 flex-1" onClick={() => setEditing(c)}>
                  Edit
                </Button>
                <Button variant="ghost" className="h-9 flex-1" onClick={() => save.mutate({ id: c.id, active: !c.active })}>
                  {c.active ? 'Hide' : 'List'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit car' : 'Add car'}>
        {editing ? <CarForm car={editing} onDone={() => setEditing(null)} /> : null}
      </Dialog>
    </div>
  );
}

function CarForm({ car, onDone }: { car: Partial<Car>; onDone: () => void }) {
  const save = useSaveCar();
  const [v, setV] = useState({
    name: car.name ?? '',
    class: car.class ?? 'sedan',
    seats: String(car.seats ?? 4),
    transmission: car.transmission ?? 'automatic',
    perDay: car.perDay ? String(car.perDay) : '',
    features: car.features ?? '',
  });
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(
          {
            id: car.id,
            name: v.name.trim(),
            class: v.class as Car['class'],
            seats: Number(v.seats),
            transmission: v.transmission as Car['transmission'],
            perDay: Number(v.perDay),
            features: v.features.trim() || undefined,
          },
          { onSuccess: onDone },
        );
      }}>
      <Input label="Make and model" placeholder="Toyota Corolla Altis" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Class" value={v.class} onChange={(e) => setV({ ...v, class: e.target.value as Car['class'] })} options={CLASSES} />
        <Input label="Seats" inputMode="numeric" value={v.seats} onChange={(e) => setV({ ...v, seats: e.target.value.replace(/\D/g, '') })} />
      </div>
      <Select
        label="Transmission"
        value={v.transmission}
        onChange={(e) => setV({ ...v, transmission: e.target.value as Car['transmission'] })}
        options={[
          { value: 'automatic', label: 'Automatic' },
          { value: 'manual', label: 'Manual' },
        ]}
      />
      <Input
        label="Day rate with driver"
        prefix="PKR"
        inputMode="numeric"
        value={v.perDay}
        onChange={(e) => setV({ ...v, perDay: e.target.value.replace(/\D/g, '') })}
        hint="Includes the driver for 8 hours. Fuel is billed at actual cost."
      />
      <Input label="Features (optional)" placeholder="AC, airport runs" value={v.features} onChange={(e) => setV({ ...v, features: e.target.value })} />
      <FormError error={save.error} />
      <Button type="submit" className="w-full" loading={save.isPending} disabled={!v.name.trim() || !v.perDay}>
        {car.id ? 'Save changes' : 'Add car'}
      </Button>
    </form>
  );
}
