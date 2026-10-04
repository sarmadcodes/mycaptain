import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '@/lib/use-responsive';
import { colors, fonts, iconSize, iconStroke, radius, space } from '@/theme';

import { Text } from './text';

export type SelectOption<T> = { label: string; value: T; hint?: string; disabled?: boolean };

type SelectProps<T> = {
  label: string;
  value: T | undefined;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  sheetTitle?: string;
  // Replace the default field with a custom button (e.g. a compact pill).
  trigger?: (selectedLabel: string | undefined) => ReactNode;
};

// Dropdown field. Opens a sheet from the bottom on phones and a centred dialog on wide screens.
export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  icon: Icon,
  error,
  sheetTitle,
  trigger,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const { tablet } = useResponsive();
  const selected = options.find((o) => o.value === value);
  const initialIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  return (
    <View style={trigger ? undefined : styles.block}>
      {trigger ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`: ${selected?.label ?? placeholder}`}
          onPress={() => setOpen(true)}>
          {trigger(selected?.label)}
        </Pressable>
      ) : (
        <Text variant="label" tone="muted">
          {label}
        </Text>
      )}
      {trigger ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.field,
            error && { borderColor: colors.red },
            pressed && { backgroundColor: colors.surface },
          ]}>
          {Icon ? <Icon color={colors.blue} size={iconSize.md} strokeWidth={iconStroke} /> : null}
          <Text style={[styles.value, !selected && { color: colors.textFaint }]} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          <ChevronDown color={colors.textMuted} size={iconSize.md} strokeWidth={iconStroke} />
        </Pressable>
      )}
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType={tablet ? 'fade' : 'slide'} onRequestClose={() => setOpen(false)}>
        <View style={[styles.overlay, tablet && styles.overlayCenter]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Close" />
          <SafeAreaView edges={['bottom']} style={[styles.sheet, tablet && styles.dialog]}>
            {!tablet ? <View style={styles.grabber} /> : null}
            <Text variant="heading" style={styles.sheetTitle}>
              {sheetTitle ?? label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              initialScrollIndex={initialIndex > 3 ? initialIndex - 2 : 0}
              getItemLayout={(_, i) => ({ length: ROW, offset: ROW * i, index: i })}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => {
                const isSel = item.value === value;
                return (
                  <Pressable
                    disabled={item.disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSel, disabled: item.disabled }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.row, isSel && styles.rowSel, pressed && { backgroundColor: colors.surface }]}>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="body"
                        style={[
                          isSel && { fontFamily: fonts.semibold, color: colors.blue },
                          item.disabled && { color: colors.textFaint },
                        ]}>
                        {item.label}
                      </Text>
                      {item.hint ? (
                        <Text variant="caption" tone="muted">
                          {item.hint}
                        </Text>
                      ) : null}
                    </View>
                    {isSel ? <Check color={colors.blue} size={iconSize.md} strokeWidth={2} /> : null}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const ROW = 56;

const styles = StyleSheet.create({
  block: { gap: space.sm },
  field: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  value: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,28,48,0.45)' },
  overlayCenter: { justifyContent: 'center', alignItems: 'center', padding: space.xl },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.md,
    paddingBottom: space.md,
  },
  dialog: { width: 420, maxWidth: '100%', borderRadius: radius.xl, paddingTop: space.md },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginVertical: space.sm,
  },
  sheetTitle: { paddingHorizontal: space.md, paddingVertical: space.md },
  row: {
    height: ROW,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  rowSel: { backgroundColor: colors.paleBlue },
});
