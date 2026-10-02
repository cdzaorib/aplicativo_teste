import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { iniciarNuvem } from '@/nuvem/iniciar';
import { useListaStore } from '@/store/lista';

SplashScreen.preventAutoHideAsync();

function temaNavegacao(base: Theme, cores: (typeof Colors)['light' | 'dark']): Theme {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.primary,
      background: cores.background,
      card: cores.background,
      text: cores.text,
      border: cores.border,
    },
  };
}

/**
 * Aguarda a lista salva no aparelho ser carregada, mantendo a splash screen até lá,
 * e então liga a sincronização com a nuvem.
 */
function useListaCarregada() {
  const carregada = useListaStore((s) => s.carregada);

  useEffect(() => {
    if (!carregada) return;
    SplashScreen.hideAsync();
    // Só sincroniza depois de ter a lista do aparelho, para não misturar com uma lista vazia.
    return iniciarNuvem();
  }, [carregada]);

  return carregada;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const carregada = useListaCarregada();

  if (!carregada) return null;

  const tema =
    scheme === 'dark'
      ? temaNavegacao(DarkTheme, Colors.dark)
      : temaNavegacao(DefaultTheme, Colors.light);

  return (
    <ThemeProvider value={tema}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/novo" options={{ presentation: 'modal', title: 'Novo item' }} />
        <Stack.Screen name="item/[id]" options={{ presentation: 'modal', title: 'Editar item' }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
