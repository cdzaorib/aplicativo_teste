import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AvisoRevisao } from '@/components/aviso-revisao';
import { Botao } from '@/components/botao';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';

export default function ContaScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, insets]}>
      <ThemedText type="subtitle">Conta</ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">Sua lista na nuvem</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Em breve você poderá entrar com sua conta Google para guardar a lista na nuvem e
          compartilhar com a família. Por enquanto, a lista fica salva neste aparelho.
        </ThemedText>
        <Botao titulo="Entrar com Google (em breve)" desabilitado onPress={() => {}} />
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">Sobre o conteúdo</ThemedText>
        <AvisoRevisao />
        <ThemedText type="small" themeColor="textSecondary">
          Os itens marcados como &quot;Evitar&quot; seguem recomendações de entidades oficiais,
          citadas em cada item.
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Versão {Constants.expoConfig?.version}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  secao: {
    gap: Spacing.two,
  },
});
