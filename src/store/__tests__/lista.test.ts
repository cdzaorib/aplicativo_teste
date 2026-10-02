import AsyncStorage from '@react-native-async-storage/async-storage';

import { CATALOGO } from '@/domain/catalogo';
import { useListaStore } from '../lista';

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
  useListaStore.setState({ itens: [], ordem: 'prioridade' });
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

  it('guarda a ordem escolhida', () => {
    estado().definirOrdem('valor');
    expect(estado().ordem).toBe('valor');
  });
});

describe('carregamento do aparelho', () => {
  beforeEach(() => {
    useListaStore.setState({ carregada: false });
  });

  it('marca como carregada e restaura a lista salva', async () => {
    const salvo = { itens: [{ id: 'a', nome: 'Berço' }], ordem: 'nome' };
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockResolvedValueOnce(JSON.stringify({ state: salvo, version: 1 }));

    await useListaStore.persist.rehydrate();

    expect(estado()).toMatchObject({ carregada: true, ordem: 'nome', itens: salvo.itens });
  });

  it('marca como carregada mesmo se a leitura falhar, para não travar o app', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('falhou'));
    jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

    await useListaStore.persist.rehydrate();

    expect(estado().carregada).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });
});
