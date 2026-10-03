import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { formatarPreco } from '@/domain/lista';
import {
  explicarAvaliacao,
  TITULOS_AVALIACAO,
  type Avaliacao,
  type Referencia,
} from '@/domain/precos';
import { PESQUISA_PRECOS_EM } from '@/domain/faixas-preco';
import type { UnidadePreco } from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';

const CORES: Record<Avaliacao, [ThemeColor, ThemeColor]> = {
  suspeito: ['evitarBg', 'evitarText'],
  barato: ['essencialBg', 'essencialText'],
  normal: ['utilBg', 'utilText'],
  caro: ['alertaBg', 'alertaText'],
};

/** Resultado da avaliação de um preço, com a cor e a explicação de cada caso. */
export function AvaliacaoPreco({
  avaliacao,
  exigeInmetro,
}: {
  avaliacao: Avaliacao;
  exigeInmetro?: boolean;
}) {
  const theme = useTheme();
  const [fundo, texto] = CORES[avaliacao];
  return (
    <View style={[styles.caixa, { backgroundColor: theme[fundo] }]}>
      <ThemedText type="smallBold" style={{ color: theme[texto] }}>
        {TITULOS_AVALIACAO[avaliacao]}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme[texto] }}>
        {explicarAvaliacao(avaliacao, exigeInmetro)}
      </ThemedText>
    </View>
  );
}

/** Faixa de preço comum de um item e de onde ela veio. */
export function FaixaReferencia({
  referencia,
  unidade,
}: {
  referencia: Referencia | undefined;
  unidade: UnidadePreco;
}) {
  if (!referencia) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Ainda não temos uma faixa de preço para este item.
      </ThemedText>
    );
  }
  const { faixa, origem, quantidade } = referencia;
  return (
    <View style={styles.faixa}>
      <ThemedText type="smallBold">
        Faixa comum: {formatarPreco(faixa.minCentavos)} a {formatarPreco(faixa.maxCentavos)} por{' '}
        {unidade}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {origem === 'informados'
          ? `Com base em ${quantidade} preços informados por quem usa o app.`
          : `Aproximada, pesquisada em lojas online (${PESQUISA_PRECOS_EM}).`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  faixa: {
    gap: Spacing.half,
  },
});
