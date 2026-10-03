import type { ItemLista } from '@/domain/tipos';
import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';
import { useListaStore } from '@/store/lista';
import { entrarNaLista, ErroCompartilhar, formatarCodigo } from '../compartilhar';

jest.mock('@/nuvem/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('@/nuvem/sincronizar', () => ({ sincronizar: jest.fn(() => Promise.resolve()) }));

const rpc = jest.mocked(supabase!.rpc);

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
  rpc.mockReset();
  jest.mocked(sincronizar).mockClear();
  useListaStore.setState({ itens: [itemDoAparelho] });
});

describe('formatarCodigo', () => {
  it('separa o código em dois blocos', () => {
    expect(formatarCodigo('K7P2QX9M')).toBe('K7P2-QX9M');
  });
});

describe('entrarNaLista', () => {
  it('troca a lista do aparelho pela compartilhada', async () => {
    rpc.mockResolvedValue({ data: 'lista-da-gabi', error: null } as never);

    await entrarNaLista('k7p2-qx9m');

    expect(rpc).toHaveBeenCalledWith('entrar_na_lista', { codigo: 'k7p2-qx9m' });
    expect(useListaStore.getState().itens).toEqual([]);
    expect(sincronizar).toHaveBeenCalledTimes(2);
  });

  it('avisa quando o código não existe e mantém a lista do aparelho', async () => {
    rpc.mockResolvedValue({ data: null, error: null } as never);

    await expect(entrarNaLista('ZZZZ-ZZZZ')).rejects.toThrow(
      new ErroCompartilhar('Código de convite inválido. Confira com quem enviou.'),
    );
    expect(useListaStore.getState().itens).toEqual([itemDoAparelho]);
  });

  it('mostra a mensagem do banco quando passa do limite de tentativas', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'Muitas tentativas. Tente de novo daqui a uma hora.' },
    } as never);

    await expect(entrarNaLista('ZZZZ-ZZZZ')).rejects.toThrow(
      'Muitas tentativas. Tente de novo daqui a uma hora.',
    );
  });
});
