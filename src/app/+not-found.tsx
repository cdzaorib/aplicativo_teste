import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Endereço que não existe, por exemplo um link da lista de presentes copiado pela metade. */
export default function PaginaNaoEncontrada() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={[styles.fundo, { backgroundColor: theme.background }]}>
        <View style={styles.conteudo}>
          <ThemedText type="subtitle" accessibilityRole="header">
            Página não encontrada
          </ThemedText>
          <ThemedText>
            O endereço pode estar incompleto. Se alguém mandou o link da lista de presentes, peça o
            link de novo.
          </ThemedText>
          <Link href="/" style={styles.link}>
            <ThemedText type="linkPrimary">Ir para a minha lista</ThemedText>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  link: {
    paddingVertical: Spacing.two,
  },
});
