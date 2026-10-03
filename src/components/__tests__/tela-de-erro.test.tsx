import { fireEvent, render, screen } from '@testing-library/react-native';

import { TelaDeErro } from '../tela-de-erro';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('TelaDeErro', () => {
  it('explica o problema, mostra o detalhe e tenta de novo', async () => {
    const retry = jest.fn(() => Promise.resolve());
    await render(<TelaDeErro error={new Error('falhou ao ler a lista')} retry={retry} />);

    expect(screen.getByText('Algo deu errado')).toBeOnTheScreen();
    expect(screen.getByText(/falhou ao ler a lista/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Tentar de novo'));
    expect(retry).toHaveBeenCalled();
  });
});
