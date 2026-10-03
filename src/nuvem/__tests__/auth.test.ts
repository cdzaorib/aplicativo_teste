import type { ItemLista } from '@/domain/tipos';
import { supabase } from '@/nuvem/supabase';
import { useGestacaoStore } from '@/store/gestacao';
import { useListaStore } from '@/store/lista';
import { concluirLogin, excluirConta } from '../auth';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/nuvem/supabase', () => ({
  supabase: {
    auth: { exchangeCodeForSession: jest.fn(), signOut: jest.fn() },
    functions: { invoke: jest.fn() },
  },
}));

const trocar = jest.mocked(supabase!.auth.exchangeCodeForSession);
const chamarFuncao = jest.mocked(supabase!.functions.invoke);
const encerrarSessao = jest.mocked(supabase!.auth.signOut);

const itemDoAparelho: ItemLista = {
  id: 'a',
  nome: 'Berço',
  categoria: 'quarto',
  prioridade: 'essencial',
  modelo: '',
  quantidade: 1,
  comprado: false,
  criadoEm: 1,
  atualizadoEm: 1,
};

beforeEach(() => {
  trocar.mockReset();
  chamarFuncao.mockReset();
  encerrarSessao.mockReset().mockResolvedValue({ error: null });
  useListaStore.setState({ itens: [itemDoAparelho], listaId: 'l1' });
  useGestacaoStore.setState({ dataPrevista: '2027-01-15' });
});

describe('excluirConta', () => {
  it('exclui na nuvem, encerra a sessão e apaga a lista e a data prevista do aparelho', async () => {
    chamarFuncao.mockResolvedValue({ data: { ok: true }, error: null } as never);

    await excluirConta();

    expect(chamarFuncao).toHaveBeenCalledWith('excluir-conta', { method: 'POST' });
    expect(encerrarSessao).toHaveBeenCalledWith({ scope: 'local' });
    expect(useListaStore.getState().itens).toEqual([]);
    expect(useGestacaoStore.getState().dataPrevista).toBeUndefined();
  });

  it('mantém tudo se a nuvem não excluir', async () => {
    chamarFuncao.mockResolvedValue({ data: null, error: new Error('sem internet') } as never);

    await expect(excluirConta()).rejects.toThrow('sem internet');

    expect(encerrarSessao).not.toHaveBeenCalled();
    expect(useListaStore.getState().itens).toEqual([itemDoAparelho]);
    expect(useGestacaoStore.getState().dataPrevista).toBe('2027-01-15');
  });
});

describe('concluirLogin', () => {
  it('troca cada código uma vez só, mesmo chamado pela tela e pela rota de volta', async () => {
    trocar.mockResolvedValue({ data: {}, error: null } as never);

    await Promise.all([concluirLogin('codigo-1'), concluirLogin('codigo-1')]);

    expect(trocar).toHaveBeenCalledTimes(1);
    expect(trocar).toHaveBeenCalledWith('codigo-1');
  });

  it('repassa o erro do Supabase para quem pediu o login', async () => {
    trocar.mockResolvedValue({ data: {}, error: new Error('código expirado') } as never);

    await expect(concluirLogin('codigo-2')).rejects.toThrow('código expirado');
  });
});
