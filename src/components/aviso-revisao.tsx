import { StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Aviso exibido enquanto o conteúdo do catálogo não passou por revisão profissional. */
export function AvisoRevisao() {
  const theme = useTheme();
  return (
    <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
      <Icone nome="info" cor={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.texto}>
        Conteúdo em revisão. As sugestões são um guia de compras e não substituem a orientação do
        seu pediatra ou obstetra.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  texto: {
    flex: 1,
  },
});
