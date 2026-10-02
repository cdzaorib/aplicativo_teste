import type { RegistroNuvem } from '@/domain/sincronizacao';
import type { ItemLista } from '@/domain/tipos';
import { useListaStore } from '@/store/lista';
import { sincronizarLista, type RepositorioLista } from '../sincronizar-lista';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function item(id: string, atualizadoEm: number): ItemLista {
  return {
    id,
    nome: `Item ${id}`,
    categoria: 'quarto',
    prioridade: 'util',
    modelo: '',
    quantidade: 1,
    comprado: false,
    criadoEm: 1,
    atualizadoEm,
  };
}

/** Nuvem em memória, que guarda os registros por id como a tabela faz. */
function nuvemFalsa(inicial: RegistroNuvem[] = []) {
  const registros = new Map(inicial.map((r) => [r.id, r]));
  const repositorio: RepositorioLista = {
    buscar: jest.fn(async () => [...registros.values()]),
    gravar: jest.fn(async (novos: RegistroNuvem[]) => {
      novos.forEach((r) => registros.set(r.id, r));
    }),
  };
  return { repositorio, registros };
}

const estado = () => useListaStore.getState();

beforeEach(() => {
  useListaStore.setState({ itens: [], removidos: {}, versaoLocal: 0 });
});

describe('sincronizarLista', () => {
  it('envia a lista local e traz o que só está na nuvem', async () => {
    useListaStore.setState({ itens: [item('local', 10)] });
    const { repositorio, registros } = nuvemFalsa([{ ...item('nuvem', 10), removido: false }]);

    await expect(sincronizarLista(repositorio)).resolves.toBe(true);

    expect(
      estado()
        .itens.map((i) => i.id)
        .sort(),
    ).toEqual(['local', 'nuvem']);
    expect([...registros.keys()].sort()).toEqual(['local', 'nuvem']);
  });

  it('envia as remoções e depois esquece delas', async () => {
    useListaStore.setState({ removidos: { a: 20 } });
    const { repositorio, registros } = nuvemFalsa([{ ...item('a', 10), removido: false }]);

    await sincronizarLista(repositorio);

    expect(registros.get('a')).toMatchObject({ removido: true, atualizadoEm: 20 });
    expect(estado().removidos).toEqual({});
  });

  it('não grava nada quando já está tudo igual', async () => {
    useListaStore.setState({ itens: [item('a', 10)] });
    const { repositorio } = nuvemFalsa([{ ...item('a', 10), removido: false }]);

    await sincronizarLista(repositorio);

    expect(repositorio.gravar).not.toHaveBeenCalled();
  });

  it('não perde uma alteração feita durante a sincronização', async () => {
    useListaStore.setState({ itens: [item('a', 10)] });
    const { repositorio, registros } = nuvemFalsa();
    let primeiraBusca = true;
    const buscarOriginal = repositorio.buscar;
    repositorio.buscar = async () => {
      if (primeiraBusca) {
        primeiraBusca = false;
        // O usuário adiciona um item enquanto a nuvem responde.
        estado().adicionar({
          nome: 'Novo',
          categoria: 'quarto',
          prioridade: 'util',
          modelo: '',
          quantidade: 1,
        });
      }
      return buscarOriginal();
    };

    await expect(sincronizarLista(repositorio)).resolves.toBe(true);

    expect(estado().itens).toHaveLength(2);
    expect(registros.size).toBe(2);
  });

  it('não altera a lista local se a nuvem falhar', async () => {
    useListaStore.setState({ itens: [item('a', 10)], removidos: { b: 5 } });
    const repositorio: RepositorioLista = {
      buscar: async () => {
        throw new Error('sem internet');
      },
      gravar: async () => {},
    };

    await expect(sincronizarLista(repositorio)).rejects.toThrow('sem internet');
    expect(estado().itens).toEqual([item('a', 10)]);
    expect(estado().removidos).toEqual({ b: 5 });
  });
});
