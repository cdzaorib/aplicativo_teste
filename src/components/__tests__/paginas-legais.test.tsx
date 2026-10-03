import { render, screen } from '@testing-library/react-native';

import ExcluirContaScreen from '@/app/excluir-conta';
import PrivacidadeScreen from '@/app/privacidade';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('páginas de privacidade', () => {
  it('a política diz que os dados da gestação não saem do aparelho', async () => {
    await render(<PrivacidadeScreen />);
    expect(screen.getByText('Política de privacidade')).toBeOnTheScreen();
    expect(screen.getByText(/próxima consulta e as perguntas/)).toBeOnTheScreen();
    expect(screen.getByText(/Nunca são enviados para a nuvem/)).toBeOnTheScreen();
    // Enquanto o e-mail não for definido, a página avisa em vez de inventar um.
    expect(screen.getByText(/e-mail de contato a definir/)).toBeOnTheScreen();
  });

  it('a página de exclusão explica como excluir pelo app e sem ele', async () => {
    await render(<ExcluirContaScreen />);
    expect(screen.getByText('Pelo app')).toBeOnTheScreen();
    expect(screen.getByText('Sem o app')).toBeOnTheScreen();
    expect(screen.getByText(/os preços que você informou/)).toBeOnTheScreen();
  });
});
