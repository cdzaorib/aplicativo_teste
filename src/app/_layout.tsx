import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { prepararLembretes } from '@/notificacoes/lembretes';
import { iniciarNuvem } from '@/nuvem/iniciar';
import { useAparenciaStore } from '@/store/aparencia';
import { useGestacaoStore } from '@/store/gestacao';
import { useListaStore } from '@/store/lista';

SplashScreen.preventAutoHideAsync();

// Se uma tela quebrar, mostra uma mensagem com "Tentar de novo" em vez de uma tela branca.
export { TelaDeErro as ErrorBoundary } from '@/components/tela-de-erro';

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
 * Aguarda a lista salva no aparelho ser carregada e então liga a sincronização com a nuvem.
 */
function useListaCarregada() {
  const carregada = useListaStore((s) => s.carregada);

  useEffect(() => {
    // Só sincroniza depois de ter a lista do aparelho, para não misturar com uma lista vazia.
    if (carregada) return iniciarNuvem();
  }, [carregada]);

  return carregada;
}

/** Com avisos de fase ou de consulta, prepara a exibição deles com o app aberto. */
function useLembretes() {
  const lembretes = useGestacaoStore((s) => s.lembretes);
  const temConsulta = useGestacaoStore((s) => s.proximaConsulta !== undefined);
  useEffect(() => {
    if (lembretes || temConsulta) prepararLembretes().catch(() => {});
  }, [lembretes, temConsulta]);
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const listaCarregada = useListaCarregada();
  // O tema escolhido já foi lido do aparelho (para não abrir no tema errado e trocar em seguida).
  const aparenciaCarregada = useAparenciaStore((s) => s.carregada);
  const carregado = listaCarregada && aparenciaCarregada;
  useLembretes();

  // A splash screen fica até a lista e o tema serem lidos do aparelho.
  useEffect(() => {
    if (carregado) SplashScreen.hideAsync();
  }, [carregado]);

  if (!carregado) return null;

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
        <Stack.Screen
          name="preco/[catalogoId]"
          options={{ presentation: 'modal', title: 'Comparar preço' }}
        />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="privacidade" options={{ title: 'Privacidade' }} />
        <Stack.Screen name="excluir-conta" options={{ title: 'Excluir conta' }} />
        <Stack.Screen name="presentes" options={{ title: 'Lista de presentes' }} />
        <Stack.Screen name="mala" options={{ title: 'Mala da maternidade' }} />
        {/* Página que os convidados abrem pelo link, sem login. */}
        <Stack.Screen name="presente/[codigo]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
