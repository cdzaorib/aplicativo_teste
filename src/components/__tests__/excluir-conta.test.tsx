import { fireEvent, render, screen } from '@testing-library/react-native';

import { confirmar } from '@/components/confirmar';
import { excluirConta } from '@/nuvem/auth';
import { ExcluirConta } from '../excluir-conta';

jest.mock('@/components/confirmar', () => ({ confirmar: jest.fn() }));
jest.mock('@/nuvem/auth', () => ({ excluirConta: jest.fn() }));

beforeEach(() => {
  jest.mocked(confirmar).mockReset();
  jest.mocked(excluirConta).mockReset().mockResolvedValue(undefined);
});

describe('ExcluirConta', () => {
  it('exclui a conta depois que a pessoa confirma', async () => {
    jest.mocked(confirmar).mockResolvedValue(true);
    await render(<ExcluirConta />);

    await fireEvent.press(screen.getByText('Excluir minha conta'));

    expect(confirmar).toHaveBeenCalledWith(
      'Excluir minha conta',
      expect.stringContaining('Não dá para desfazer'),
      'Excluir',
    );
    expect(excluirConta).toHaveBeenCalledTimes(1);
  });

  it('não exclui se a pessoa cancela', async () => {
    jest.mocked(confirmar).mockResolvedValue(false);
    await render(<ExcluirConta />);

    await fireEvent.press(screen.getByText('Excluir minha conta'));

    expect(excluirConta).not.toHaveBeenCalled();
  });

  it('avisa quando não consegue excluir', async () => {
    jest.mocked(confirmar).mockResolvedValue(true);
    jest.mocked(excluirConta).mockRejectedValue(new Error('sem internet'));
    await render(<ExcluirConta />);

    await fireEvent.press(screen.getByText('Excluir minha conta'));

    expect(await screen.findByText(/Não foi possível excluir a conta/)).toBeOnTheScreen();
  });
});
