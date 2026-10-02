import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, ChipGroup, Header, Screen, Section, Text, TextField } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/store';
import { space } from '@/theme';

export function VehicleStep() {
  const vehicle = useBookingDraft((s) => s.vehicle);
  const set = useBookingDraft((s) => s.set);
  const patch = (p: Partial<typeof vehicle>) => set({ vehicle: { ...vehicle, ...p } });

  return (
    <Screen
      header={<Header title="Your vehicle" />}
      footer={<Button label="See matched drivers" onPress={() => router.push('/book/driver/drivers')} />}>
      <View style={styles.intro}>
        <Text variant="title">What will your driver drive?</Text>
        <Text tone="muted">We match driver experience to your car.</Text>
      </View>
      <View style={styles.form}>
        <Section title="Vehicle class">
          <ChipGroup
            value={vehicle.class}
            onChange={(v) => patch({ class: v })}
            options={[
              { label: 'Small car', value: 'small' },
              { label: 'Sedan', value: 'sedan' },
              { label: 'SUV', value: 'suv' },
              { label: 'Luxury', value: 'luxury' },
            ]}
          />
        </Section>
        <TextField
          label="Make and model"
          placeholder="Toyota Fortuner, Honda Civic"
          value={vehicle.makeModel}
          onChangeText={(t) => patch({ makeModel: t })}
        />
        <Section title="Engine size">
          <ChipGroup
            value={vehicle.engine}
            onChange={(v) => patch({ engine: v })}
            options={['660', '1000', '1300', '1800', '2700+'].map((e) => ({ label: `${e} cc`, value: e }))}
          />
        </Section>
        <Section title="Transmission">
          <ChipGroup
            value={vehicle.transmission}
            onChange={(v) => patch({ transmission: v })}
            options={[
              { label: 'Automatic', value: 'automatic' },
              { label: 'Manual', value: 'manual' },
            ]}
          />
        </Section>
        <TextField
          label="Instructions for the driver (optional)"
          placeholder="Parking, routes, anything to know"
          value={vehicle.notes}
          onChangeText={(t) => patch({ notes: t })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.sm, marginBottom: space.xxl },
  form: { gap: space.xxl },
});
