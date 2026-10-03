import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { ItemLista } from '@/domain/tipos';
import { buscarMembros } from '@/nuvem/compartilhar';
import { useSessaoStore } from '@/store/sessao';
import { useNomeDoComprador, useNomesDaLista } from '../use-nomes-da-lista';

jest.mock('@/nuvem/compartilhar', () => ({ buscarMembros: jest.fn() }));

function Nomes() {
  return <Text>{JSON.stringify(useNomesDaLista())}</Text>;
}

const item = (compradoPor: string, comprado = true): ItemLista => ({
  id: compradoPor,
  nome: 'Berço',
  categoria: 'quarto',
  prioridade: 'essencial',
  modelo: '',
  quantidade: 1,
  comprado,
  compradoPor,
  criadoEm: 1,
  atualizadoEm: 1,
});

function Compradores() {
  const nomeDoComprador = useNomeDoComprador();
  const itens = [item('paulo'), item('gabi'), item('paulo', false), item('saiu-da-lista')];
  return <Text>{itens.map((i) => nomeDoComprador(i) ?? '-').join(',')}</Text>;
}

const lista = (id: string) => ({
  id,
  souDona: true,
  podeEditarLista: true,
  podeEditarPrecos: true,
});

beforeEach(() => {
  jest.mocked(buscarMembros).mockReset();
  useSessaoStore.setState({ usuario: null, lista: undefined, mudancasMembros: 0 });
});

describe('useNomesDaLista', () => {
  it('fica vazio sem login, sem buscar nada', async () => {
    await render(<Nomes />);
    expect(screen.getByText('{}')).toBeOnTheScreen();
    expect(buscarMembros).not.toHaveBeenCalled();
  });

  it('busca os nomes da lista e de novo quando alguém entra', async () => {
    jest.mocked(buscarMembros).mockResolvedValue([
      { userId: 'gabi', nome: 'Gabi', eDona: true, podeEditarLista: true, podeEditarPrecos: true },
      { userId: 'sem-nome', eDona: false, podeEditarLista: false, podeEditarPrecos: false },
    ]);
    useSessaoStore.setState({ usuario: { id: 'gabi' }, lista: lista('l1') });
    await render(<Nomes />);
    expect(await screen.findByText('{"gabi":"Gabi"}')).toBeOnTheScreen();

    await act(async () => useSessaoStore.setState({ mudancasMembros: 1 }));
    expect(buscarMembros).toHaveBeenCalledTimes(2);
  });

  it('diz quem comprou só quando foi outra pessoa que ainda está na lista', async () => {
    jest.mocked(buscarMembros).mockResolvedValue([
      { userId: 'gabi', nome: 'Gabi', eDona: true, podeEditarLista: true, podeEditarPrecos: true },
      {
        userId: 'paulo',
        nome: 'Paulo',
        eDona: false,
        podeEditarLista: true,
        podeEditarPrecos: true,
      },
    ]);
    useSessaoStore.setState({ usuario: { id: 'gabi' }, lista: lista('l1') });
    await render(<Compradores />);
    expect(await screen.findByText('Paulo,-,-,-')).toBeOnTheScreen();
  });
});
