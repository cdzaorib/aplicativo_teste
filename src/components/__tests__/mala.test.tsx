import { fireEvent, render, screen } from '@testing-library/react-native';

import MalaScreen from '@/app/mala';
import { confirmar } from '@/components/confirmar';
import { TOTAL_ITENS_MALA } from '@/domain/mala-maternidade';
import { useGestacaoStore } from '@/store/gestacao';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/components/vibrar', () => ({ vibrarAoMarcar: jest.fn() }));
jest.mock('@/components/confirmar', () => ({ confirmar: jest.fn() }));

beforeEach(() => {
  useGestacaoStore.setState({ dataPrevista: undefined, malaPronta: [] });
});

describe('Mala da maternidade', () => {
  it('marca e desmarca itens, e conta os prontos', async () => {
    await render(<MalaScreen />);
    expect(screen.getByText(`0 de ${TOTAL_ITENS_MALA} itens prontos`)).toBeOnTheScreen();

    const caderneta = screen.getByRole('checkbox', { name: 'Caderneta da Gestante' });
    await fireEvent.press(caderneta);
    expect(caderneta).toBeChecked();
    expect(screen.getByText(`1 de ${TOTAL_ITENS_MALA} itens prontos`)).toBeOnTheScreen();
    expect(useGestacaoStore.getState().malaPronta).toEqual(['doc-caderneta']);

    await fireEvent.press(caderneta);
    expect(caderneta).not.toBeChecked();
    expect(useGestacaoStore.getState().malaPronta).toEqual([]);
  });

  it('mostra o prazo pela data prevista, as fontes e o direito ao acompanhante', async () => {
    useGestacaoStore.setState({ dataPrevista: '2027-03-30' });
    await render(<MalaScreen />);
    expect(screen.getByText(/Deixe a mala pronta até 09\/03\/2027/)).toBeOnTheScreen();
    expect(screen.getByText(/Caderneta da Gestante \(Ministério da Saúde\)/)).toBeOnTheScreen();
    expect(screen.getByText(/Lei 11\.108\/2005/)).toBeOnTheScreen();
    expect(screen.getByText(/Cada maternidade tem a sua lista/)).toBeOnTheScreen();
  });

  it('desmarca tudo só depois de confirmar', async () => {
    useGestacaoStore.setState({ malaPronta: ['doc-caderneta', 'bebe-touca'] });
    await render(<MalaScreen />);

    jest.mocked(confirmar).mockResolvedValueOnce(false);
    await fireEvent.press(screen.getByText('Desmarcar tudo'));
    expect(useGestacaoStore.getState().malaPronta).toHaveLength(2);

    jest.mocked(confirmar).mockResolvedValueOnce(true);
    await fireEvent.press(screen.getByText('Desmarcar tudo'));
    expect(useGestacaoStore.getState().malaPronta).toEqual([]);
    expect(screen.queryByText('Desmarcar tudo')).toBeNull();
  });
});
