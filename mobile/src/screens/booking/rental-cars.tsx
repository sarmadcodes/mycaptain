import { router } from 'expo-router';
import { CarFront, Cog, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, EmptyView, ErrorView, Header, LoadingView, Screen, Segmented, Text } from '@/components/ui';
import { useCars } from '@/features/api';
import { formatPKR } from '@/features/booking/pricing';
import { useBookingDraft } from '@/features/booking/store';
import type { RentalCarApi as RentalCar } from '@/types/api';
import { useResponsive } from '@/lib/use-responsive';
import { colors, iconSize, iconStroke, radius, space } from '@/theme';

type Filter = 'all' | RentalCar['class'];

export function RentalCars() {
  const { tablet } = useResponsive();
  const set = useBookingDraft((s) => s.set);
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, error, refetch } = useCars();
  const list = (data?.cars ?? []).filter((c) => filter === 'all' || c.class === filter);

  const pick = (car: RentalCar) => {
    set({
      service: 'rental',
      personnel: 1,
      carId: car.id,
      carPerDay: car.perDay,
      carName: car.name,
      carCompany: car.companyName,
      vehicle: {
        class: car.class,
        makeModel: car.name,
        engine: '',
        transmission: car.transmission,
        notes: '',
      },
    });
    router.push('/book/schedule');
  };

  return (
    <Screen wide header={<Header title="Rent a car" />}>
      <View style={styles.intro}>
        <Text variant="title">Choose a car</Text>
        <Text tone="muted">
          Every rental comes with a verified driver. Day rates cover 8 hours; fuel is billed at actual cost.
        </Text>
      </View>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { label: 'All', value: 'all' },
          { label: 'Economy', value: 'small' },
          { label: 'Sedan', value: 'sedan' },
          { label: 'SUV', value: 'suv' },
          { label: 'Luxury', value: 'luxury' },
        ]}
      />
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={refetch} />
      ) : !list.length ? (
        <EmptyView
          icon={CarFront}
          title="No cars available"
          body={filter === 'all' ? 'Partner fleets are being added. Check back soon.' : 'Try another category.'}
        />
      ) : (
        <View style={[styles.grid, { marginTop: space.xl }]}>
          {list.map((car) => (
            <View key={car.id} style={{ width: tablet ? '48.5%' : '100%' }}>
              <CarCard car={car} onPress={() => pick(car)} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function CarCard({ car, onPress }: { car: RentalCar; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${car.name}, ${formatPKR(car.perDay)} per day`}>
      {({ pressed }) => (
        <View style={[styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
          <View style={styles.visual}>
            <CarFront color={colors.navy} size={44} strokeWidth={1.25} />
            <View style={styles.badge}>
              <Badge label="Driver included" tone="green" />
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="heading" style={{ flex: 1 }}>
                {car.name}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="heading">{formatPKR(car.perDay)}</Text>
                <Text variant="caption" tone="muted">
                  per day
                </Text>
              </View>
            </View>
            <View style={styles.meta}>
              <Meta icon={Users} text={`${car.seats} seats`} />
              <Meta icon={Cog} text={car.transmission === 'automatic' ? 'Automatic' : 'Manual'} />
            </View>
            <Text variant="label" tone="muted">
              {[car.features, car.companyName].filter(Boolean).join('. ')}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Meta({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Icon color={colors.textMuted} size={iconSize.sm} strokeWidth={iconStroke} />
      <Text variant="label" tone="muted">
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.lg },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bg },
  visual: { height: 120, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: space.md, left: space.md },
  body: { padding: space.lg, gap: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  meta: { flexDirection: 'row', gap: space.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
