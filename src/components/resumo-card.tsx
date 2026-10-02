import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { formatarPreco, type ResumoLista } from '@/domain/lista';
import { useTheme } from '@/hooks/use-theme';

export function ResumoCard({ resumo }: { resumo: ResumoLista }) {
  const theme = useTheme();
  const progresso = resumo.total ? resumo.comprados / resumo.total : 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">
        {resumo.comprados} de {resumo.total} itens comprados
      </ThemedText>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: resumo.total, now: resumo.comprados }}
        style={[styles.barra, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[
            styles.preenchimento,
            { backgroundColor: theme.primary, width: `${progresso * 100}%` },
          ]}
        />
      </View>
      <View style={styles.valores}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Previsto
          </ThemedText>
          <ThemedText type="smallBold">{formatarPreco(resumo.previstoCentavos)}</ThemedText>
        </View>
        <View style={styles.direita}>
          <ThemedText type="small" themeColor="textSecondary">
            Gasto
          </ThemedText>
          <ThemedText type="smallBold">{formatarPreco(resumo.gastoCentavos)}</ThemedText>
        </View>
      </View>
      {resumo.semPreco > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {resumo.semPreco === 1
            ? '1 item ainda sem preço'
            : `${resumo.semPreco} itens ainda sem preço`}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  barra: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
  },
  valores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  direita: {
    alignItems: 'flex-end',
  },
});
