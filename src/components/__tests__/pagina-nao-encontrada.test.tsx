import { render, screen } from '@testing-library/react-native';

import PaginaNaoEncontrada from '@/app/+not-found';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

describe('página não encontrada', () => {
  it('explica em português e leva de volta para a lista', async () => {
    await render(<PaginaNaoEncontrada />);
    expect(screen.getByRole('header', { name: 'Não achamos esta página' })).toBeOnTheScreen();
    expect(screen.getByText(/peça o link de novo/)).toBeOnTheScreen();
    expect(screen.getByText('Ir para a minha lista')).toBeOnTheScreen();
  });
});
