import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { semanasDeGestacao } from '@/domain/gestacao';

type GestacaoState = {
  /** Data prevista do parto (AAAA-MM-DD). */
  dataPrevista?: string;
  definirDataPrevista: (dataPrevista: string | undefined) => void;
};

/**
 * Data prevista do parto. É dado de saúde (LGPD): fica só neste aparelho, nunca vai para a nuvem
 * nem para a lista compartilhada.
 */
export const useGestacaoStore = create<GestacaoState>()(
  persist(
    (set) => ({
      definirDataPrevista: (dataPrevista) => set({ dataPrevista }),
    }),
    {
      name: 'gestacao',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ dataPrevista }) => ({ dataPrevista }),
      skipHydration: typeof window === 'undefined',
    },
  ),
);

/** Semanas de gestação hoje, ou `undefined` se a pessoa não informou a data prevista. */
export function useSemanasDeGestacao(): number | undefined {
  const dataPrevista = useGestacaoStore((s) => s.dataPrevista);
  return dataPrevista ? semanasDeGestacao(dataPrevista) : undefined;
}
