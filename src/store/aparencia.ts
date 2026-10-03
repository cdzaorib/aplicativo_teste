import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Tema escolhido pela pessoa. "automatica" segue o tema do celular. */
export type Aparencia = 'automatica' | 'clara' | 'escura';

export const APARENCIAS: Record<Aparencia, string> = {
  automatica: 'Automático',
  clara: 'Claro',
  escura: 'Escuro',
};

type AparenciaState = {
  aparencia: Aparencia;
  /** A escolha já foi lida do aparelho (a splash screen espera, para não piscar o tema). */
  carregada: boolean;
  definirAparencia: (aparencia: Aparencia) => void;
};

/**
 * No celular, troca também o tema dos componentes do sistema (abas nativas, alertas, teclado).
 * Na web não existe essa troca: lá vale só o `useColorScheme` do app.
 */
function aplicarNoSistema(aparencia: Aparencia) {
  if (Platform.OS === 'web') return;
  Appearance.setColorScheme(
    aparencia === 'clara' ? 'light' : aparencia === 'escura' ? 'dark' : 'unspecified',
  );
}

export const useAparenciaStore = create<AparenciaState>()(
  persist(
    (set) => ({
      aparencia: 'automatica',
      carregada: false,
      definirAparencia: (aparencia) => {
        aplicarNoSistema(aparencia);
        set({ aparencia });
      },
    }),
    {
      name: 'aparencia',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ aparencia }) => ({ aparencia }),
      skipHydration: typeof window === 'undefined',
      // Em caso de erro o persist não marca a hidratação como concluída; sem esta flag o app
      // ficaria preso na splash screen. Com erro, segue no automático.
      onRehydrateStorage: () => (estado, erro) => {
        if (erro) console.warn('Não foi possível carregar o tema salvo', erro);
        if (estado) aplicarNoSistema(estado.aparencia);
        useAparenciaStore.setState({ carregada: true });
      },
    },
  ),
);

/** O tema que vale: o escolhido, ou o do sistema no automático. */
export function temaEscolhido<T extends string | null | undefined>(
  aparencia: Aparencia,
  sistema: T,
): 'light' | 'dark' | T {
  if (aparencia === 'clara') return 'light';
  if (aparencia === 'escura') return 'dark';
  return sistema;
}
