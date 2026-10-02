import { StyleSheet, View } from 'react-native';

import { space } from '@/theme';

import { Text } from './text';

// Label on the left, value on the right. Used in summaries and receipts.
export function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant={strong ? 'heading' : 'body'} tone={strong ? 'default' : 'muted'}>
        {label}
      </Text>
      <Text variant={strong ? 'heading' : 'body'} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.lg, paddingVertical: space.sm },
  value: { flexShrink: 1, textAlign: 'right' },
});
