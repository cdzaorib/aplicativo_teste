import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { buscarMembros } from '@/nuvem/compartilhar';
import { useSessaoStore } from '@/store/sessao';
import { useNomesDaLista } from '../use-nomes-da-lista';

jest.mock('@/nuvem/compartilhar', () => ({ buscarMembros: jest.fn() }));

function Nomes() {
  return <Text>{JSON.stringify(useNomesDaLista())}</Text>;
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
});
