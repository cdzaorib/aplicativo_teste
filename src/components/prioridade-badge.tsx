import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { PRIORIDADES, type Prioridade } from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';

export function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme[`${prioridade}Bg`] }]}>
      <Text style={[styles.texto, { color: theme[`${prioridade}Text`] }]}>
        {PRIORIDADES[prioridade]}
      </Text>
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
