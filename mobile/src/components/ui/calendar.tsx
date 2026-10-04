import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, iconSize, iconStroke, radius, space } from '@/theme';

import { Text } from './text';

type CalendarProps = {
  // 'YYYY-MM-DD'
  value: string;
  onChange: (date: string) => void;
  // Optional range highlight end (inclusive), e.g. multi-day bookings.
  rangeEnd?: string;
  maxDaysAhead?: number;
};

const WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Month grid. Past days and days beyond the booking window are disabled.
export function Calendar({ value, onChange, rangeEnd, maxDaysAhead = 90 }: CalendarProps) {
  const today = dayjs().startOf('day');
  const last = today.add(maxDaysAhead, 'day');
  const [month, setMonth] = useState(dayjs(value).startOf('month'));

  const lead = (month.day() + 6) % 7; // Monday-first offset
  const cells: (dayjs.Dayjs | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: month.daysInMonth() }, (_, i) => month.date(i + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const canPrev = month.isAfter(today, 'month');
  const canNext = month.add(1, 'month').isBefore(last.add(1, 'day'), 'month') || month.add(1, 'month').isSame(last, 'month');
  const sel = dayjs(value);
  const end = rangeEnd ? dayjs(rangeEnd) : undefined;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <NavButton dir="prev" disabled={!canPrev} onPress={() => setMonth((m) => m.subtract(1, 'month'))} />
        <Text variant="heading">{month.format('MMMM YYYY')}</Text>
        <NavButton dir="next" disabled={!canNext} onPress={() => setMonth((m) => m.add(1, 'month'))} />
      </View>

      <View style={styles.row}>
        {WEEK.map((w) => (
          <View key={w} style={styles.cell}>
            <Text variant="caption" tone="faint">
              {w}
            </Text>
          </View>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const disabled = d.isBefore(today) || d.isAfter(last);
            const isSel = d.isSame(sel, 'day');
            const inRange = end && d.isAfter(sel, 'day') && !d.isAfter(end, 'day');
            const isToday = d.isSame(today, 'day');
            return (
              <View key={i} style={[styles.cell, inRange && styles.rangeCell]}>
                <Pressable
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={d.format('dddd D MMMM')}
                  accessibilityState={{ selected: isSel, disabled }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(d.format('YYYY-MM-DD'));
                  }}
                  style={({ pressed }) => [
                    styles.day,
                    isSel && styles.daySel,
                    pressed && !isSel && { backgroundColor: colors.surface },
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      disabled && { color: colors.border },
                      isToday && !isSel && { color: colors.blue, fontFamily: fonts.bold },
                      isSel && { color: colors.onPrimary, fontFamily: fonts.bold },
                    ]}>
                    {d.date()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function NavButton({ dir, disabled, onPress }: { dir: 'prev' | 'next'; disabled: boolean; onPress: () => void }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={dir === 'prev' ? 'Previous month' : 'Next month'}
      style={({ pressed }) => [styles.nav, (disabled || pressed) && { opacity: disabled ? 0.3 : 0.6 }]}>
      <Icon color={colors.text} size={iconSize.md} strokeWidth={iconStroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 2,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  nav: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, aspectRatio: 1, maxHeight: 52, alignItems: 'center', justifyContent: 'center' },
  rangeCell: { backgroundColor: colors.paleBlue },
  day: {
    width: '86%',
    height: '86%',
    maxWidth: 44,
    maxHeight: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySel: { backgroundColor: colors.blue },
  dayText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
