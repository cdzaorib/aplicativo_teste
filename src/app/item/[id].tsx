import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AvaliacaoPreco, FaixaReferencia } from '@/components/avaliacao-preco';
import { Botao } from '@/components/botao';
import { confirmar } from '@/components/confirmar';
import { ItemForm } from '@/components/item-form';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { CATALOGO } from '@/domain/catalogo';
import { avaliarPreco } from '@/domain/precos';
import { useReferencia } from '@/hooks/use-referencia';
import { useTheme } from '@/hooks/use-theme';
import { useListaStore } from '@/store/lista';
import { usePermissao } from '@/store/sessao';

export default function EditarItemScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useListaStore((s) => s.itens.find((i) => i.id === id));
  const atualizar = useListaStore((s) => s.atualizar);
  const remover = useListaStore((s) => s.remover);
  const referencia = useReferencia(item?.catalogoId);
  const permissao = usePermissao();

  if (!item) {
    return (
      <View style={[styles.conteudo, { backgroundColor: theme.background }]}>
        <ThemedText themeColor="textSecondary">Este item não está mais na lista.</ThemedText>
      </View>
    );
  }

  const doCatalogo = CATALOGO.find((c) => c.id === item.catalogoId);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, styles.espacado]}
      keyboardShouldPersistTaps="handled">
      {doCatalogo && (
        <View style={[styles.dica, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small">{doCatalogo.porque}</ThemedText>
          {doCatalogo.fonte && (
            <ThemedText type="small" themeColor="textSecondary">
              Fonte: {doCatalogo.fonte}
            </ThemedText>
          )}
        </View>
      )}

      {doCatalogo && doCatalogo.prioridade !== 'evitar' && (
        <View style={[styles.dica, { backgroundColor: theme.backgroundElement }]}>
          <FaixaReferencia referencia={referencia} />
          {referencia && item.precoCentavos !== undefined && (
            <AvaliacaoPreco
              avaliacao={avaliarPreco(item.precoCentavos, referencia.faixa)}
              exigeInmetro={doCatalogo.inmetro}
            />
          )}
          <Botao
            titulo="Comparar preços"
            variante="secundario"
            onPress={() =>
              router.push({
                pathname: '/preco/[catalogoId]',
                params: { catalogoId: doCatalogo.id },
              })
            }
          />
        </View>
      )}

      <ItemForm
        inicial={item}
        mostrarComprado
        permissao={permissao}
        onSalvar={(valores) => {
          atualizar(item.id, valores);
          router.back();
        }}
      />

      {permissao === 'total' && (
        <Botao
          titulo="Remover da lista"
          variante="perigo"
          onPress={async () => {
            if (await confirmar('Remover item', `Remover "${item.nome}" da lista?`, 'Remover')) {
              router.back();
              remover(item.id);
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  espacado: {
    gap: Spacing.three,
  },
  dica: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
});
