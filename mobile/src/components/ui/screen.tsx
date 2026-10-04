import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '@/lib/use-responsive';
import { colors, space } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  // Pinned to the bottom, above the keyboard (primary actions).
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  // Two-column flows (calendar, car grid) get a wider column on tablets.
  wide?: boolean;
};

// Forms and flow steps read best in a narrow column, so cap them tighter than tab screens.
const FLOW_MAX_WIDTH = 640;
const WIDE_MAX_WIDTH = 960;

export function Screen({ children, header, footer, scroll = true, contentStyle, wide }: ScreenProps) {
  const { gutter, tablet, width } = useResponsive();
  const maxWidth = tablet ? (wide ? WIDE_MAX_WIDTH : FLOW_MAX_WIDTH) : width;
  const column = { width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: gutter } as const;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {header}
      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={footer ? 120 : 24}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, column, contentStyle]}>
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.content, styles.fill, column, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={styles.footerBar}>
          <View style={[styles.footer, column]}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingTop: space.lg, paddingBottom: space.xl },
  fill: { flex: 1 },
  footerBar: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.bg },
  footer: { paddingTop: space.md, paddingBottom: space.md, gap: space.md },
});
