import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/botao';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Aparece no lugar de uma tela que quebrou (o `ErrorBoundary` do Expo Router), em vez de uma tela
 * branca no app instalado. No desenvolvimento, o Expo mostra também o erro em vermelho por cima.
 */
export function TelaDeErro({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Se o erro aconteceu antes de o app terminar de abrir, a splash screen ainda cobre a tela.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.conteudo,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four },
      ]}>
      <ThemedText type="subtitle" accessibilityRole="header">
        Algo deu errado
      </ThemedText>
      <ThemedText>
        Seus dados não foram apagados. Tente de novo; se o erro continuar, feche o app e abra de
        novo.
      </ThemedText>
      <Botao titulo="Tentar de novo" onPress={retry} />
      <ThemedText type="small" themeColor="textSecondary" selectable>
        Detalhe do erro, para quem for corrigir: {error.message}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
