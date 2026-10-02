import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Chips } from '@/components/chips';
import { ItemListaLinha } from '@/components/item-lista-linha';
import { ResumoCard } from '@/components/resumo-card';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ordenarLista, resumirLista } from '@/domain/lista';
import { ORDENS } from '@/domain/tipos';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { useListaStore } from '@/store/lista';

export default function MinhaListaScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();
  const itens = useListaStore((s) => s.itens);
  const ordem = useListaStore((s) => s.ordem);
  const definirOrdem = useListaStore((s) => s.definirOrdem);
  const alternarComprado = useListaStore((s) => s.alternarComprado);

  const vazia = itens.length === 0;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, insets]}
      data={ordenarLista(itens, ordem)}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ItemListaLinha item={item} onAlternar={() => alternarComprado(item.id)} />
      )}
      ItemSeparatorComponent={Separador}
      ListHeaderComponent={
        <View style={styles.cabecalho}>
          <ThemedText type="subtitle">Minha lista</ThemedText>
          {!vazia && (
            <>
              <ResumoCard resumo={resumirLista(itens)} />
              <View style={styles.ordenacao}>
                <ThemedText type="small" themeColor="textSecondary">
                  Ordenar por
                </ThemedText>
                <Chips rotulo="Ordenar por" opcoes={ORDENS} valor={ordem} onChange={definirOrdem} />
              </View>
            </>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.vazia}>
          <ThemedText themeColor="textSecondary">
            Sua lista está vazia. Comece pelas sugestões de enxoval ou adicione um item seu.
          </ThemedText>
          <Botao titulo="Ver sugestões" onPress={() => router.navigate('/sugestoes')} />
        </View>
      }
      ListFooterComponent={
        <View style={styles.rodape}>
          <Botao
            titulo="Adicionar item próprio"
            variante="secundario"
            onPress={() => router.push('/item/novo')}
          />
        </View>
      }
    />
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  cabecalho: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  ordenacao: {
    gap: Spacing.two,
  },
  vazia: {
    gap: Spacing.three,
  },
  rodape: {
    marginTop: Spacing.three,
  },
  separador: {
    height: Spacing.two,
  },
});
