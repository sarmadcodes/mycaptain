import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  // Pinned to the bottom, above the keyboard (primary actions).
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({ children, header, footer, scroll = true, contentStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {header}
      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={footer ? 120 : 24}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, contentStyle]}>
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xl },
  fill: { flex: 1 },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.md, gap: space.md },
});
