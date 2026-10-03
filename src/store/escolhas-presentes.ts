import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type EscolhasState = {
  /** Nome que o convidado usou da última vez, para não digitar de novo. */
  nome: string;
  /** Presentes que este aparelho escolheu: "código/item" -> chave para desfazer. */
  chaves: Record<string, string>;
  lembrar: (codigo: string, itemId: string, chave: string, nome: string) => void;
  esquecer: (codigo: string, itemId: string) => void;
};

export const chaveDaEscolha = (codigo: string, itemId: string) => `${codigo}/${itemId}`;

/**
 * Escolhas feitas por um convidado na lista de presentes, guardadas só no aparelho dele (no
 * navegador, na versão web). É o que permite desfazer a escolha depois.
 */
export const useEscolhasPresentesStore = create<EscolhasState>()(
  persist(
    (set) => ({
      nome: '',
      chaves: {},
      lembrar: (codigo, itemId, chave, nome) =>
        set((s) => ({ nome, chaves: { ...s.chaves, [chaveDaEscolha(codigo, itemId)]: chave } })),
      esquecer: (codigo, itemId) =>
        set((s) => {
          const { [chaveDaEscolha(codigo, itemId)]: _esquecida, ...chaves } = s.chaves;
          return { chaves };
        }),
    }),
    {
      name: 'escolhas-presentes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ nome, chaves }) => ({ nome, chaves }),
      skipHydration: typeof window === 'undefined',
    },
  ),
);
