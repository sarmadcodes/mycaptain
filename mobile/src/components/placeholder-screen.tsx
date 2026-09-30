import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, space, type } from '@/theme';

// Temporary body for routes whose real screen is not built yet.
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>Screen coming in the next step.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: space.xl, gap: space.sm },
  title: { ...type.title, color: colors.text },
  caption: { ...type.body, color: colors.textMuted },
});
