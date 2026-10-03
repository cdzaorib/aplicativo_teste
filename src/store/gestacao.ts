import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { semanasDeGestacao } from '@/domain/gestacao';
import { useInicioDoDia } from '@/hooks/use-inicio-do-dia';

type GestacaoState = {
  /** Data prevista do parto (AAAA-MM-DD). */
  dataPrevista?: string;
  /** A pessoa quer ser avisada no começo de cada fase de compras. */
  lembretes: boolean;
  /** Próxima consulta de pré-natal ("AAAA-MM-DDTHH:MM", hora local). */
  proximaConsulta?: string;
  /** Perguntas que a pessoa anotou para levar à consulta. */
  perguntasConsulta: string;
  definirDataPrevista: (dataPrevista: string | undefined) => void;
  definirLembretes: (lembretes: boolean) => void;
  definirProximaConsulta: (quando: string | undefined) => void;
  definirPerguntasConsulta: (perguntas: string) => void;
  /** Apaga tudo o que está guardado aqui (ao excluir a conta). */
  esquecerTudo: () => void;
};

/**
 * Data prevista do parto e próxima consulta. São dados de saúde (LGPD): ficam só neste aparelho,
 * nunca vão para a nuvem nem para a lista compartilhada.
 */
export const useGestacaoStore = create<GestacaoState>()(
  persist(
    (set) => ({
      lembretes: false,
      perguntasConsulta: '',
      definirDataPrevista: (dataPrevista) => set({ dataPrevista }),
      definirLembretes: (lembretes) => set({ lembretes }),
      definirProximaConsulta: (proximaConsulta) => set({ proximaConsulta }),
      definirPerguntasConsulta: (perguntasConsulta) => set({ perguntasConsulta }),
      esquecerTudo: () =>
        set({
          dataPrevista: undefined,
          lembretes: false,
          proximaConsulta: undefined,
          perguntasConsulta: '',
        }),
    }),
    {
      name: 'gestacao',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ dataPrevista, lembretes, proximaConsulta, perguntasConsulta }) => ({
        dataPrevista,
        lembretes,
        proximaConsulta,
        perguntasConsulta,
      }),
      skipHydration: typeof window === 'undefined',
    },
  ),
);

/** Semanas de gestação hoje, ou `undefined` se a pessoa não informou a data prevista. */
export function useSemanasDeGestacao(): number | undefined {
  const dataPrevista = useGestacaoStore((s) => s.dataPrevista);
  const hoje = useInicioDoDia();
  return dataPrevista ? semanasDeGestacao(dataPrevista, new Date(hoje)) : undefined;
}
