import type { LucideIcon } from 'lucide-react-native';
import { CloudOff, Inbox } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/services/api/client';
import { colors, iconStroke, radius, space } from '@/theme';

import { Button } from './button';
import { Text } from './text';

// Loading, error and empty states shared by every data screen.
export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.blue} />
      {label ? (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <CloudOff color={colors.textFaint} size={32} strokeWidth={iconStroke} />
      <Text variant="heading">Could not load this</Text>
      <Text tone="muted" style={styles.center}>
        {errorMessage(error)}
      </Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyView({
  title,
  body,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  body?: string;
  icon?: LucideIcon;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Icon color={colors.blue} size={26} strokeWidth={iconStroke} />
      </View>
      <Text variant="heading">{title}</Text>
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {action ? <Button label={action.label} variant="secondary" onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  center: { textAlign: 'center', maxWidth: 360 },
  icon: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
});
