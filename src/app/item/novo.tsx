import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ItemForm, type ValoresItem } from '@/components/item-form';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useListaStore } from '@/store/lista';

const VAZIO: ValoresItem = {
  nome: '',
  modelo: '',
  categoria: 'quarto',
  prioridade: 'util',
  quantidade: 1,
  precoCentavos: undefined,
  comprado: false,
};

export default function NovoItemScreen() {
  const theme = useTheme();
  const adicionar = useListaStore((s) => s.adicionar);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled">
      <ItemForm
        inicial={VAZIO}
        onSalvar={({ comprado: _comprado, ...dados }) => {
          adicionar(dados);
          router.back();
        }}
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
});
