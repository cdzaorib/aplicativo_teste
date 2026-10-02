import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { novoId } from '@/domain/lista';
import type { ItemCatalogo, ItemLista, OrdemLista } from '@/domain/tipos';

export type NovoItem = Omit<ItemLista, 'id' | 'comprado' | 'criadoEm' | 'atualizadoEm'>;
export type AlteracaoItem = Partial<Omit<ItemLista, 'id' | 'criadoEm' | 'atualizadoEm'>>;

type ListaState = {
  itens: ItemLista[];
  ordem: OrdemLista;
  /** Itens removidos ainda não enviados à nuvem: id -> momento da remoção. */
  removidos: Record<string, number>;
  /** Lista da nuvem a que estes itens pertencem (desde a última sincronização). */
  listaId?: string;
  /** Aumenta a cada alteração feita pelo usuário; usado para disparar a sincronização. Não é salvo. */
  versaoLocal: number;
  /** Leitura do aparelho concluída, com sucesso ou não. Não é salvo. */
  carregada: boolean;
  adicionar: (dados: NovoItem) => string;
  /** Adiciona itens do catálogo, ignorando os que já estão na lista e os marcados como "evitar". */
  adicionarDoCatalogo: (itens: ItemCatalogo[]) => void;
  atualizar: (id: string, alteracao: AlteracaoItem) => void;
  alternarComprado: (id: string) => void;
  remover: (id: string) => void;
  definirOrdem: (ordem: OrdemLista) => void;
  /** Substitui a lista pelo resultado da sincronização (não conta como alteração do usuário). */
  aplicarSincronizacao: (itens: ItemLista[], listaId?: string) => void;
  /** Apaga a lista do aparelho (ao sair da conta). */
  limpar: () => void;
};

type ListaSalva = Pick<ListaState, 'itens' | 'ordem' | 'removidos' | 'listaId'>;

/** Migra listas salvas por versões anteriores do app. */
export function migrarListaSalva(salva: unknown, versao: number): ListaSalva {
  const estado = salva as ListaSalva;
  if (versao < 2) {
    // v1 não tinha data de atualização nem registro de removidos.
    return {
      ...estado,
      itens: estado.itens.map((item) => ({ ...item, atualizadoEm: item.criadoEm })),
      removidos: {},
    };
  }
  return estado;
}

const alterado = (s: ListaState) => ({ versaoLocal: s.versaoLocal + 1 });

/** Lista de compras do usuário, salva no aparelho. */
export const useListaStore = create<ListaState>()(
  persist(
    (set) => ({
      itens: [],
      ordem: 'prioridade',
      removidos: {},
      versaoLocal: 0,
      carregada: false,

      adicionar: (dados) => {
        const id = novoId();
        const agora = Date.now();
        set((s) => ({
          ...alterado(s),
          itens: [
            ...s.itens,
            { ...dados, id, comprado: false, criadoEm: agora, atualizadoEm: agora },
          ],
        }));
        return id;
      },

      adicionarDoCatalogo: (itensCatalogo) =>
        set((s) => {
          const jaNaLista = new Set(s.itens.map((i) => i.catalogoId));
          const agora = Date.now();
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
              criadoEm: agora,
              atualizadoEm: agora,
            }));
          return novos.length ? { ...alterado(s), itens: [...s.itens, ...novos] } : s;
        }),

      atualizar: (id, alteracao) =>
        set((s) => ({
          ...alterado(s),
          itens: s.itens.map((i) =>
            i.id === id ? { ...i, ...alteracao, atualizadoEm: Date.now() } : i,
          ),
        })),

      alternarComprado: (id) =>
        set((s) => ({
          ...alterado(s),
          itens: s.itens.map((i) =>
            i.id === id ? { ...i, comprado: !i.comprado, atualizadoEm: Date.now() } : i,
          ),
        })),

      remover: (id) =>
        set((s) => ({
          ...alterado(s),
          itens: s.itens.filter((i) => i.id !== id),
          removidos: { ...s.removidos, [id]: Date.now() },
        })),

      definirOrdem: (ordem) => set({ ordem }),

      aplicarSincronizacao: (itens, listaId) =>
        set({ itens, removidos: {}, ...(listaId && { listaId }) }),

      limpar: () => set({ itens: [], removidos: {}, listaId: undefined }),
    }),
    {
      name: 'lista-enxoval',
      version: 2,
      migrate: migrarListaSalva,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): ListaSalva => ({
        itens: s.itens,
        ordem: s.ordem,
        removidos: s.removidos,
        listaId: s.listaId,
      }),
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
