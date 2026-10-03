import { fireEvent, render, screen } from '@testing-library/react-native';

import ListaDePresentesScreen from '@/app/presente/[codigo]';
import PresentesScreen from '@/app/presentes';
import type { ItemPresente } from '@/domain/presentes';
import type { ItemLista } from '@/domain/tipos';
import {
  buscarPresentes,
  desfazerReservaPresente,
  incluirPresentes,
  reservarPresente,
  verListaPresentes,
} from '@/nuvem/presentes';
import { useEscolhasPresentesStore } from '@/store/escolhas-presentes';
import { useListaStore } from '@/store/lista';
import { useSessaoStore } from '@/store/sessao';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  useLocalSearchParams: () => ({ codigo: 'CODIGO' }),
}));
jest.mock('@/nuvem/supabase', () => ({ supabase: {} }));
jest.mock('@/nuvem/presentes', () => ({
  ...jest.requireActual('@/nuvem/presentes'),
  buscarPresentes: jest.fn(),
  criarLinkPresentes: jest.fn(),
  incluirPresentes: jest.fn(),
  verListaPresentes: jest.fn(),
  reservarPresente: jest.fn(),
  desfazerReservaPresente: jest.fn(),
}));

const presente = (id: string, nome: string, situacao: ItemPresente['situacao']): ItemPresente => ({
  id,
  catalogoId: id,
  nome,
  modelo: '',
  quantidade: 1,
  categoria: 'higiene',
  situacao,
});

const item = (id: string, nome: string, comprado = false): ItemLista => ({
  id,
  catalogoId: id,
  nome,
  categoria: 'higiene',
  prioridade: 'essencial',
  modelo: '',
  quantidade: 1,
  comprado,
  criadoEm: 1,
  atualizadoEm: 1,
});

beforeEach(() => {
  jest.clearAllMocks();
  useEscolhasPresentesStore.setState({ nome: '', chaves: {} });
});

describe('página dos convidados', () => {
  it('mostra o que está livre e marca o presente com o nome de quem vai dar', async () => {
    jest.mocked(verListaPresentes).mockResolvedValue({
      nome: 'Gabi',
      itens: [presente('banheira', 'Banheira', 'livre'), presente('berco', 'Berço', 'reservado')],
    });
    jest.mocked(reservarPresente).mockResolvedValue('chave-1');
    await render(<ListaDePresentesScreen />);

    expect(await screen.findByText('Chá de bebê de Gabi')).toBeOnTheScreen();
    expect(screen.getByText('Já escolhido por alguém.')).toBeOnTheScreen();
    expect(screen.getByText(/Costuma custar de R\$/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Vou dar este'));
    await fireEvent.changeText(screen.getByLabelText('Seu nome'), 'Tia Maria');
    await fireEvent.press(screen.getByText('Confirmar'));

    expect(reservarPresente).toHaveBeenCalledWith('CODIGO', 'banheira', 'Tia Maria');
    expect(useEscolhasPresentesStore.getState()).toMatchObject({
      nome: 'Tia Maria',
      chaves: { 'CODIGO/banheira': 'chave-1' },
    });
    expect(verListaPresentes).toHaveBeenCalledTimes(2); // recarregou depois de escolher
  });

  it('quem escolheu pelo aparelho pode desfazer', async () => {
    useEscolhasPresentesStore.setState({ chaves: { 'CODIGO/banheira': 'chave-1' } });
    jest.mocked(verListaPresentes).mockResolvedValue({
      itens: [presente('banheira', 'Banheira', 'reservado')],
    });
    await render(<ListaDePresentesScreen />);

    await fireEvent.press(await screen.findByText('Desfazer'));
    expect(desfazerReservaPresente).toHaveBeenCalledWith('CODIGO', 'banheira', 'chave-1');
    expect(useEscolhasPresentesStore.getState().chaves).toEqual({});
  });

  it('avisa quando o link não vale mais', async () => {
    jest.mocked(verListaPresentes).mockResolvedValue(null);
    await render(<ListaDePresentesScreen />);
    expect(await screen.findByText(/Este link não vale mais/)).toBeOnTheScreen();
  });
});

describe('tela da lista de presentes', () => {
  it('pede login para montar a lista', async () => {
    useSessaoStore.setState({ usuario: null, lista: undefined });
    await render(<PresentesScreen />);
    expect(screen.getByText(/entre na sua conta/)).toBeOnTheScreen();
  });

  it('mostra quem escolheu e inclui os itens que faltam comprar', async () => {
    useSessaoStore.setState({
      usuario: { id: 'gabi' },
      lista: { id: 'l1', souDona: true, podeEditarLista: true, podeEditarPrecos: true },
    });
    useListaStore.setState({
      itens: [
        item('banheira', 'Banheira'),
        item('mamadeira', 'Mamadeira'),
        item('berco', 'Berço', true),
      ],
    });
    jest.mocked(buscarPresentes).mockResolvedValue({
      codigo: 'CODIGO',
      presentes: { banheira: { reservadoPor: 'Tia Maria' } },
    });
    jest.mocked(incluirPresentes).mockResolvedValue();
    await render(<PresentesScreen />);

    expect(await screen.findByText('Escolhido por Tia Maria')).toBeOnTheScreen();
    // Comprado e fora da lista de presentes: não aparece.
    expect(screen.queryByText('Berço')).toBeNull();
    // Sem o endereço da versão web, o app avisa em vez de mostrar um link quebrado.
    expect(screen.getByText(/quando a versão web do app estiver no ar/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Incluir o item que falta comprar'));
    expect(incluirPresentes).toHaveBeenCalledWith('l1', ['mamadeira']);
  });
});
