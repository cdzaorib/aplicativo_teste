import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { ItemForm } from '@/components/item-form';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { CATALOGO } from '@/domain/catalogo';
import { useTheme } from '@/hooks/use-theme';
import { useListaStore } from '@/store/lista';

function confirmarRemocao(nome: string, onConfirmar: () => void) {
  const mensagem = `Remover "${nome}" da lista?`;
  if (Platform.OS === 'web') {
    if (window.confirm(mensagem)) onConfirmar();
    return;
  }
  Alert.alert('Remover item', mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: onConfirmar },
  ]);
}

export default function EditarItemScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useListaStore((s) => s.itens.find((i) => i.id === id));
  const atualizar = useListaStore((s) => s.atualizar);
  const remover = useListaStore((s) => s.remover);

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

      <ItemForm
        inicial={item}
        mostrarComprado
        onSalvar={(valores) => {
          atualizar(item.id, valores);
          router.back();
        }}
      />

      <Botao
        titulo="Remover da lista"
        variante="perigo"
        onPress={() =>
          confirmarRemocao(item.nome, () => {
            router.back();
            remover(item.id);
          })
        }
      />
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
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
});
