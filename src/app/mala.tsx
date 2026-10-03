import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { confirmar } from '@/components/confirmar';
import { Icone } from '@/components/icone';
import { ThemedText } from '@/components/themed-text';
import { vibrarAoMarcar } from '@/components/vibrar';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { formatarData } from '@/domain/gestacao';
import {
  DIREITO_ACOMPANHANTE,
  itensProntos,
  prazoDaMala,
  SECOES_MALA,
  TOTAL_ITENS_MALA,
  type ItemMala,
} from '@/domain/mala-maternidade';
import { useTheme } from '@/hooks/use-theme';
import { useGestacaoStore } from '@/store/gestacao';

/** Mala da maternidade: o que levar para o parto, marcado à medida que fica pronto. */
export default function MalaScreen() {
  const theme = useTheme();
  const dataPrevista = useGestacaoStore((s) => s.dataPrevista);
  const malaPronta = useGestacaoStore((s) => s.malaPronta);
  const { alternarItemDaMala, esvaziarMala } = useGestacaoStore.getState();
  const prontos = itensProntos(malaPronta);

  function alternar(id: string) {
    vibrarAoMarcar(!malaPronta.includes(id));
    alternarItemDaMala(id);
  }

  async function desmarcarTudo() {
    const confirmado = await confirmar(
      'Desmarcar tudo',
      'Todos os itens da mala voltam a ficar por arrumar.',
      'Desmarcar',
    );
    if (confirmado) esvaziarMala();
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.conteudo}>
      <View style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">
          {prontos} de {TOTAL_ITENS_MALA} itens prontos
        </ThemedText>
        <ThemedText type="small">
          {dataPrevista
            ? `Deixe a mala pronta até ${formatarData(prazoDaMala(dataPrevista))}, 3 semanas antes da data prevista do parto.`
            : 'Deixe a mala pronta pelo menos 3 semanas antes da data prevista do parto.'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Cada maternidade tem a sua lista. Pergunte à sua o que ela fornece e o que pede para
          levar.
        </ThemedText>
      </View>

      {SECOES_MALA.map((secao) => (
        <View key={secao.titulo} style={styles.secao}>
          <ThemedText type="smallBold" accessibilityRole="header">
            {secao.titulo}
          </ThemedText>
          {secao.itens.map((item) => (
            <LinhaDaMala
              key={item.id}
              item={item}
              pronto={malaPronta.includes(item.id)}
              onAlternar={() => alternar(item.id)}
            />
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Fonte: {secao.fonte}
          </ThemedText>
        </View>
      ))}

      <View style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">Acompanhante</ThemedText>
        <ThemedText type="small">{DIREITO_ACOMPANHANTE}</ThemedText>
      </View>

      {prontos > 0 && (
        <Botao titulo="Desmarcar tudo" variante="secundario" onPress={desmarcarTudo} />
      )}
    </ScrollView>
  );
}

function LinhaDaMala({
  item,
  pronto,
  onAlternar,
}: {
  item: ItemMala;
  pronto: boolean;
  onAlternar: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={pronto}
      accessibilityLabel={item.nome}
      onPress={onAlternar}
      style={[styles.linha, { backgroundColor: theme.backgroundElement }]}>
      <Icone
        nome={pronto ? 'marcado' : 'desmarcado'}
        cor={pronto ? theme.primary : theme.textSecondary}
        tamanho={24}
      />
      <ThemedText
        style={[styles.expandir, pronto && styles.pronto]}
        themeColor={pronto ? 'textSecondary' : 'text'}>
        {item.nome}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  cartao: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  secao: {
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  expandir: {
    flex: 1,
  },
  pronto: {
    textDecorationLine: 'line-through',
  },
});
