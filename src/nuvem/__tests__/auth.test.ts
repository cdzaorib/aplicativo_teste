import * as AppleAuthentication from 'expo-apple-authentication';

import type { ItemLista } from '@/domain/tipos';
import { cancelarAvisosDaConsulta, cancelarLembretes } from '@/notificacoes/lembretes';
import { supabase } from '@/nuvem/supabase';
import { useGestacaoStore } from '@/store/gestacao';
import { useListaStore } from '@/store/lista';
import { concluirLogin, entrarComApple, excluirConta } from '../auth';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/notificacoes/lembretes', () => ({
  cancelarLembretes: jest.fn(() => Promise.resolve()),
  cancelarAvisosDaConsulta: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('@/nuvem/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      signOut: jest.fn(),
      signInWithIdToken: jest.fn(),
      updateUser: jest.fn(),
    },
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
  useGestacaoStore.setState({
    dataPrevista: '2027-01-15',
    proximaConsulta: '2026-11-10T14:30',
    perguntasConsulta: 'Posso tomar café?',
  });
});

describe('excluirConta', () => {
  it('exclui na nuvem, encerra a sessão e apaga a lista e a data prevista do aparelho', async () => {
    chamarFuncao.mockResolvedValue({ data: { ok: true }, error: null } as never);

    await excluirConta();

    expect(chamarFuncao).toHaveBeenCalledWith('excluir-conta', { method: 'POST' });
    expect(encerrarSessao).toHaveBeenCalledWith({ scope: 'local' });
    expect(useListaStore.getState().itens).toEqual([]);
    expect(useGestacaoStore.getState()).toMatchObject({
      dataPrevista: undefined,
      proximaConsulta: undefined,
      perguntasConsulta: '',
    });
    expect(cancelarLembretes).toHaveBeenCalled();
    expect(cancelarAvisosDaConsulta).toHaveBeenCalled();
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

describe('entrarComApple', () => {
  const loginApple = jest.mocked(AppleAuthentication.signInAsync);
  const entrarComToken = jest.mocked(supabase!.auth.signInWithIdToken);
  const atualizarUsuario = jest.mocked(supabase!.auth.updateUser);

  beforeEach(() => {
    loginApple.mockReset();
    entrarComToken.mockReset().mockResolvedValue({ data: {}, error: null } as never);
    atualizarUsuario.mockReset().mockResolvedValue({ data: {}, error: null } as never);
  });

  it('entra no Supabase com o token da Apple e guarda o nome do primeiro login', async () => {
    loginApple.mockResolvedValue({
      identityToken: 'token-da-apple',
      fullName: { givenName: 'Gabi', familyName: 'Souza' },
    } as never);

    await expect(entrarComApple()).resolves.toBe(true);

    expect(entrarComToken).toHaveBeenCalledWith({ provider: 'apple', token: 'token-da-apple' });
    expect(atualizarUsuario).toHaveBeenCalledWith({ data: { full_name: 'Gabi Souza' } });
  });

  it('devolve false quando a pessoa cancela', async () => {
    loginApple.mockRejectedValue(
      Object.assign(new Error('cancelado'), { code: 'ERR_REQUEST_CANCELED' }),
    );

    await expect(entrarComApple()).resolves.toBe(false);
    expect(entrarComToken).not.toHaveBeenCalled();
  });

  it('falha sem o token da Apple', async () => {
    loginApple.mockResolvedValue({ identityToken: null, fullName: null } as never);

    await expect(entrarComApple()).rejects.toThrow('A Apple não devolveu o token de acesso.');
  });
});
