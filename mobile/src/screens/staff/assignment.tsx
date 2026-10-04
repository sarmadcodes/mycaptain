import { router, useLocalSearchParams } from 'expo-router';
import { Navigation, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { KARACHI, LiveMap } from '@/components/map/live-map';
import { Button, Card, DetailRow, Header, Screen, Section, Text } from '@/components/ui';
import { driverAssignments, guardAssignments } from '@/lib/mock-data';
import { colors, iconSize, iconStroke, space } from '@/theme';

export function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = [...driverAssignments, ...guardAssignments].find((x) => x.id === id);
  const [accepted, setAccepted] = useState(a?.status !== 'new');

  if (!a) {
    return (
      <Screen header={<Header />}>
        <Text tone="muted">This assignment is no longer available.</Text>
      </Screen>
    );
  }

  const openMaps = () => {
    const q = encodeURIComponent(a.location);
    Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  return (
    <Screen
      header={<Header title={a.id} />}
      footer={
        accepted ? (
          <>
            <Button
              label={a.service === 'guard' ? 'Navigate to post' : 'Start journey'}
              icon={<Navigation color={colors.onPrimary} size={iconSize.md} strokeWidth={iconStroke} />}
              onPress={openMaps}
            />
            <Button label="Go to duty" variant="ghost" onPress={() => router.replace('/duty')} />
          </>
        ) : (
          <Button label="Accept assignment" onPress={() => setAccepted(true)} />
        )
      }>
      <View style={styles.stack}>
        <LiveMap height={180} target={KARACHI} />
        <Card style={{ gap: 0 }}>
          <DetailRow label="When" value={a.when} />
          <DetailRow label="Duration" value={a.duration} />
          <DetailRow label={a.service === 'guard' ? 'Post' : 'Pickup'} value={a.location} />
          <DetailRow label={a.service === 'guard' ? 'Requirements' : 'Vehicle'} value={a.detail} />
          <DetailRow label="Customer" value={a.customer} />
        </Card>
        <Section title="Instructions">
          <Text tone="muted">{a.notes}</Text>
        </Section>
        {accepted ? (
          <View style={{ gap: space.sm }}>
            <Button label="Message customer" variant="secondary" onPress={() => router.push(`/messages/${a.id}`)} />
            <Button
              label="Call customer"
              variant="secondary"
              icon={<Phone color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />}
              onPress={() => Linking.openURL('tel:+923000000000')}
            />
          </View>
        ) : (
          <Text variant="caption" tone="muted">
            Customer contact details unlock after you accept.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.xl },
});
