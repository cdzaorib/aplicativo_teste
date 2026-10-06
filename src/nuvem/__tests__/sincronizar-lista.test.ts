import type { RegistroNuvem } from '@/domain/sincronizacao';
import type { ItemLista } from '@/domain/tipos';
import { useListaStore } from '@/store/lista';
import {
  itensSaoDeOutraLista,
  sincronizarLista,
  type RepositorioLista,
} from '../sincronizar-lista';

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
  useListaStore.setState({ itens: [], removidos: {}, versaoLocal: 0, listaId: undefined });
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

  it('quem só visualiza recebe a lista compartilhada e não grava nada', async () => {
    useListaStore.setState({ itens: [item('meu', 50)], removidos: { a: 60 } });
    const { repositorio } = nuvemFalsa([{ ...item('a', 10), removido: false }]);

    await sincronizarLista(repositorio, 'leitura');

    expect(repositorio.gravar).not.toHaveBeenCalled();
    expect(estado().itens).toEqual([item('a', 10)]);
    expect(estado().removidos).toEqual({});
  });

  it('quem edita preços grava só o preço', async () => {
    useListaStore.setState({ itens: [{ ...item('a', 20), precoCentavos: 999, comprado: true }] });
    const { repositorio, registros } = nuvemFalsa([{ ...item('a', 10), removido: false }]);

    await sincronizarLista(repositorio, 'precos');

    expect(registros.get('a')).toMatchObject({ precoCentavos: 999, comprado: false });
    expect(estado().itens[0]).toMatchObject({ precoCentavos: 999, comprado: false });
  });
});

describe('itens de outra lista', () => {
  it('lembra a lista sincronizada', async () => {
    const { repositorio } = nuvemFalsa();
    await sincronizarLista(repositorio, 'total', 'lista-1');
    expect(estado().listaId).toBe('lista-1');
  });

  it('descarta itens de outra lista só quando a pessoa virou convidada', () => {
    expect(itensSaoDeOutraLista(undefined, { id: 'l2', souDona: false })).toBe(false);
    expect(itensSaoDeOutraLista('l2', { id: 'l2', souDona: false })).toBe(false);
    expect(itensSaoDeOutraLista('l1', { id: 'l2', souDona: false })).toBe(true);
    // Voltou para a própria lista: os itens ficam como cópia.
    expect(itensSaoDeOutraLista('l1', { id: 'l2', souDona: true })).toBe(false);
  });
});
