import { render, screen } from '@testing-library/react-native';

import ExcluirContaScreen from '@/app/excluir-conta';
import PrivacidadeScreen from '@/app/privacidade';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe('páginas de privacidade', () => {
  it('a política diz que a data prevista do parto não sai do aparelho', async () => {
    await render(<PrivacidadeScreen />);
    expect(screen.getByText('Política de privacidade')).toBeOnTheScreen();
    expect(screen.getByText(/Nunca é enviada para a nuvem/)).toBeOnTheScreen();
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
