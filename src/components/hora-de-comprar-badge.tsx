import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Selo dos itens cuja fase de compra já chegou (pela data prevista do parto). */
export function HoraDeComprarBadge() {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.alertaBg }]}>
      <Text style={[styles.texto, { color: theme.alertaText }]}>Hora de comprar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.small,
  },
  texto: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
});
