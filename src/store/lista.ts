import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { novoId } from '@/domain/lista';
import type { ItemCatalogo, ItemLista, OrdemLista } from '@/domain/tipos';

export type NovoItem = Omit<ItemLista, 'id' | 'comprado' | 'criadoEm'>;
export type AlteracaoItem = Partial<Omit<ItemLista, 'id' | 'criadoEm'>>;

type ListaState = {
  itens: ItemLista[];
  ordem: OrdemLista;
  /** Leitura do aparelho concluída, com sucesso ou não. Não é salvo. */
  carregada: boolean;
  adicionar: (dados: NovoItem) => string;
  /** Adiciona itens do catálogo, ignorando os que já estão na lista e os marcados como "evitar". */
  adicionarDoCatalogo: (itens: ItemCatalogo[]) => void;
  atualizar: (id: string, alteracao: AlteracaoItem) => void;
  alternarComprado: (id: string) => void;
  remover: (id: string) => void;
  definirOrdem: (ordem: OrdemLista) => void;
};

/** Lista de compras do usuário, salva no aparelho. */
export const useListaStore = create<ListaState>()(
  persist(
    (set) => ({
      itens: [],
      ordem: 'prioridade',
      carregada: false,

      adicionar: (dados) => {
        const id = novoId();
        set((s) => ({
          itens: [...s.itens, { ...dados, id, comprado: false, criadoEm: Date.now() }],
        }));
        return id;
      },

      adicionarDoCatalogo: (itensCatalogo) =>
        set((s) => {
          const jaNaLista = new Set(s.itens.map((i) => i.catalogoId));
          const novos = itensCatalogo
            .filter((item) => item.prioridade !== 'evitar' && !jaNaLista.has(item.id))
            .map<ItemLista>((item) => ({
              id: novoId(),
              catalogoId: item.id,
              nome: item.nome,
              categoria: item.categoria,
              prioridade: item.prioridade,
              modelo: '',
              quantidade: Math.max(item.quantidade, 1),
              comprado: false,
              criadoEm: Date.now(),
            }));
          return novos.length ? { itens: [...s.itens, ...novos] } : s;
        }),

      atualizar: (id, alteracao) =>
        set((s) => ({ itens: s.itens.map((i) => (i.id === id ? { ...i, ...alteracao } : i)) })),

      alternarComprado: (id) =>
        set((s) => ({
          itens: s.itens.map((i) => (i.id === id ? { ...i, comprado: !i.comprado } : i)),
        })),

      remover: (id) => set((s) => ({ itens: s.itens.filter((i) => i.id !== id) })),

      definirOrdem: (ordem) => set({ ordem }),
    }),
    {
      name: 'lista-enxoval',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ itens: s.itens, ordem: s.ordem }),
      // Na pré-renderização estática da versão web (Node) não há armazenamento para ler.
      skipHydration: typeof window === 'undefined',
      // Em caso de erro o persist não marca a hidratação como concluída; sem esta flag o app
      // ficaria preso na splash screen. Com erro, seguimos com a lista vazia.
      onRehydrateStorage: () => (_estado, erro) => {
        if (erro) console.warn('Não foi possível carregar a lista salva', erro);
        useListaStore.setState({ carregada: true });
      },
    },
  ),
);
