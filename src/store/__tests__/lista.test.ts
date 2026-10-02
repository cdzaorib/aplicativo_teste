import AsyncStorage from '@react-native-async-storage/async-storage';

import { CATALOGO } from '@/domain/catalogo';
import { migrarListaSalva, useListaStore } from '../lista';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const catalogo = (id: string) => {
  const item = CATALOGO.find((c) => c.id === id);
  if (!item) throw new Error(`Item ${id} não existe no catálogo`);
  return item;
};

const estado = () => useListaStore.getState();

beforeEach(() => {
  useListaStore.setState({ itens: [], ordem: 'prioridade', removidos: {}, versaoLocal: 0 });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('lista', () => {
  it('adiciona itens do catálogo sem duplicar', () => {
    estado().adicionarDoCatalogo([catalogo('berco'), catalogo('body-curto')]);
    estado().adicionarDoCatalogo([catalogo('berco')]);

    expect(estado().itens.map((i) => i.catalogoId)).toEqual(['berco', 'body-curto']);
    expect(estado().itens[1]).toMatchObject({
      nome: 'Body manga curta',
      quantidade: 6,
      comprado: false,
    });
  });

  it('não adiciona itens marcados como "evitar"', () => {
    estado().adicionarDoCatalogo([catalogo('protetor-berco'), catalogo('andador')]);
    expect(estado().itens).toEqual([]);
    expect(estado().versaoLocal).toBe(0);
  });

  it('adiciona, atualiza, marca como comprado e remove um item próprio', () => {
    const id = estado().adicionar({
      nome: 'Cadeira de balanço',
      categoria: 'quarto',
      prioridade: 'opcional',
      modelo: '',
      quantidade: 1,
    });

    estado().atualizar(id, { precoCentavos: 45000, modelo: 'Madeira' });
    estado().alternarComprado(id);
    expect(estado().itens[0]).toMatchObject({
      nome: 'Cadeira de balanço',
      precoCentavos: 45000,
      modelo: 'Madeira',
      comprado: true,
    });

    estado().remover(id);
    expect(estado().itens).toEqual([]);
  });

  it('guarda a ordem escolhida sem contar como alteração da lista', () => {
    estado().definirOrdem('valor');
    expect(estado().ordem).toBe('valor');
    expect(estado().versaoLocal).toBe(0);
  });
});

describe('dados para sincronização', () => {
  it('registra quando cada item foi criado e alterado', () => {
    jest.useFakeTimers({ now: 1000 });
    const id = estado().adicionar({
      nome: 'Banheira',
      categoria: 'higiene',
      prioridade: 'essencial',
      modelo: '',
      quantidade: 1,
    });
    expect(estado().itens[0]).toMatchObject({ criadoEm: 1000, atualizadoEm: 1000 });

    jest.setSystemTime(2000);
    estado().atualizar(id, { modelo: 'Dobrável' });
    expect(estado().itens[0]).toMatchObject({ criadoEm: 1000, atualizadoEm: 2000 });

    jest.setSystemTime(3000);
    estado().alternarComprado(id);
    expect(estado().itens[0]).toMatchObject({ atualizadoEm: 3000 });
  });

  it('guarda a remoção para enviar à nuvem', () => {
    jest.useFakeTimers({ now: 5000 });
    estado().adicionarDoCatalogo([catalogo('berco')]);
    const { id } = estado().itens[0];

    estado().remover(id);
    expect(estado().removidos).toEqual({ [id]: 5000 });
  });

  it('conta cada alteração do usuário, mas não as vindas da sincronização', () => {
    estado().adicionarDoCatalogo([catalogo('berco')]);
    const { id } = estado().itens[0];
    estado().alternarComprado(id);
    estado().remover(id);
    expect(estado().versaoLocal).toBe(3);

    estado().aplicarSincronizacao([]);
    expect(estado().versaoLocal).toBe(3);
    expect(estado().removidos).toEqual({});
  });

  it('apaga a lista do aparelho ao sair da conta', () => {
    estado().adicionarDoCatalogo([catalogo('berco'), catalogo('banheira')]);
    estado().remover(estado().itens[0].id);

    estado().limpar();
    expect(estado().itens).toEqual([]);
    expect(estado().removidos).toEqual({});
  });
});

describe('carregamento do aparelho', () => {
  beforeEach(() => {
    useListaStore.setState({ carregada: false });
  });

  it('marca como carregada e restaura a lista salva', async () => {
    const salvo = {
      itens: [{ id: 'a', nome: 'Berço', criadoEm: 1, atualizadoEm: 2 }],
      ordem: 'nome',
      removidos: { b: 3 },
    };
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockResolvedValueOnce(JSON.stringify({ state: salvo, version: 2 }));

    await useListaStore.persist.rehydrate();

    expect(estado()).toMatchObject({ carregada: true, ...salvo });
  });

  it('marca como carregada mesmo se a leitura falhar, para não travar o app', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('falhou'));
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

    await useListaStore.persist.rehydrate();

    expect(estado().carregada).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });

  it('migra a lista salva pela primeira versão do app', async () => {
    const salvoV1 = { itens: [{ id: 'a', nome: 'Berço', criadoEm: 100 }], ordem: 'nome' };
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockResolvedValueOnce(JSON.stringify({ state: salvoV1, version: 1 }));

    await useListaStore.persist.rehydrate();

    expect(estado().itens).toEqual([{ id: 'a', nome: 'Berço', criadoEm: 100, atualizadoEm: 100 }]);
    expect(estado().removidos).toEqual({});
  });

  it('não altera listas já na versão atual', () => {
    const salva = { itens: [], ordem: 'nome' as const, removidos: { a: 1 } };
    expect(migrarListaSalva(salva, 2)).toBe(salva);
  });
});
