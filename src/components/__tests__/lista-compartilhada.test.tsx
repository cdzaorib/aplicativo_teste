import { fireEvent, render, screen } from '@testing-library/react-native';

import { buscarMembros, definirPermissoes, type Membro } from '@/nuvem/compartilhar';
import { useSessaoStore, type InfoLista } from '@/store/sessao';
import { ListaCompartilhada } from '../lista-compartilhada';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Fora de uma tela de navegação, "ao focar" vira "ao montar".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (efeito: () => void) => useEffect(efeito, [efeito]) };
});

jest.mock('@/nuvem/compartilhar', () => ({
  ...jest.requireActual('@/nuvem/compartilhar'),
  buscarMembros: jest.fn(),
  definirPermissoes: jest.fn(),
  removerMembro: jest.fn(),
  entrarNaLista: jest.fn(),
  sairDaLista: jest.fn(),
  trocarCodigoConvite: jest.fn(),
}));

const dona: Membro = {
  userId: 'u1',
  nome: 'Gabi',
  eDona: true,
  podeEditarLista: true,
  podeEditarPrecos: true,
};
const parceiro: Membro = {
  userId: 'u2',
  nome: 'Paulo',
  eDona: false,
  podeEditarLista: false,
  podeEditarPrecos: false,
};

function definirLista(lista: Partial<InfoLista>) {
  useSessaoStore.setState({
    lista: { id: 'l1', souDona: false, podeEditarLista: false, podeEditarPrecos: false, ...lista },
  });
}

beforeEach(() => {
  jest.mocked(buscarMembros).mockReset();
  jest.mocked(definirPermissoes).mockReset().mockResolvedValue(undefined);
});

describe('ListaCompartilhada', () => {
  it('a dona vê o código e libera a edição de preços para o parceiro', async () => {
    definirLista({
      souDona: true,
      podeEditarLista: true,
      podeEditarPrecos: true,
      codigoConvite: 'K7P2QX9M',
    });
    jest.mocked(buscarMembros).mockResolvedValue([dona, parceiro]);

    await render(<ListaCompartilhada />);

    expect(screen.getByText('K7P2-QX9M')).toBeOnTheScreen();
    expect(await screen.findByText('Paulo')).toBeOnTheScreen();
    // Quem já compartilha a lista não vê a opção de entrar em outra.
    expect(screen.queryByText('Recebeu um código de convite?')).toBeNull();

    await fireEvent(screen.getByLabelText('Pode editar preços'), 'valueChange', true);
    expect(definirPermissoes).toHaveBeenCalledWith('u2', false, true);
  });

  it('a dona sem convidados pode entrar na lista de outra pessoa', async () => {
    definirLista({ souDona: true, podeEditarLista: true, codigoConvite: 'K7P2QX9M' });
    jest.mocked(buscarMembros).mockResolvedValue([dona]);

    await render(<ListaCompartilhada />);

    expect(await screen.findByText('Ninguém entrou ainda.')).toBeOnTheScreen();
    expect(screen.getByText('Recebeu um código de convite?')).toBeOnTheScreen();
  });

  it('o convidado vê de quem é a lista e o que pode fazer', async () => {
    definirLista({ nomeDona: 'Gabi', podeEditarPrecos: true });

    await render(<ListaCompartilhada />);

    expect(screen.getByText('Você está na lista de Gabi')).toBeOnTheScreen();
    expect(screen.getByText('Você pode editar os preços dos itens.')).toBeOnTheScreen();
    expect(screen.getByText('Sair da lista compartilhada')).toBeOnTheScreen();
  });
});
