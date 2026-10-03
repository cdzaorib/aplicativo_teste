import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import AuthCallback from '@/app/auth-callback';
import { concluirLogin } from '@/nuvem/auth';

jest.mock('expo-router', () => ({
  Redirect: () => null,
  useLocalSearchParams: () => ({ code: 'codigo-do-google' }),
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('@/nuvem/auth', () => ({ concluirLogin: jest.fn(() => Promise.resolve()) }));

const plataformaOriginal = Platform.OS;

afterEach(() => {
  Platform.OS = plataformaOriginal;
  jest.mocked(concluirLogin).mockClear();
});

describe('rota de volta do login', () => {
  it('no celular, troca o código que chegou pela volta do login', async () => {
    await render(<AuthCallback />);
    expect(concluirLogin).toHaveBeenCalledWith('codigo-do-google');
  });

  it('na web, deixa a troca para a janela do app', async () => {
    Platform.OS = 'web';
    await render(<AuthCallback />);
    expect(concluirLogin).not.toHaveBeenCalled();
  });
});
