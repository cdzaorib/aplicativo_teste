import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EstatisticaPrecos } from '@/domain/precos';

type ReferenciasState = {
  /** Resumo dos preços informados por quem usa o app, por item do catálogo. */
  informados: Record<string, EstatisticaPrecos>;
  atualizadoEm?: number;
};

/** Referências de preço vindas da nuvem, guardadas no aparelho para funcionar offline. */
export const useReferenciasStore = create<ReferenciasState>()(
  persist(() => ({ informados: {} }), {
    name: 'referencias-precos',
    storage: createJSONStorage(() => AsyncStorage),
    skipHydration: typeof window === 'undefined',
  }),
);
