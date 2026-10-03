import { act, render, screen } from '@testing-library/react-native';
import { AppState, Text, type AppStateStatus } from 'react-native';

import { useInicioDoDia } from '../use-inicio-do-dia';

function Dia() {
  return <Text>{new Date(useInicioDoDia()).toLocaleDateString('pt-BR')}</Text>;
}

describe('useInicioDoDia', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('muda quando a pessoa volta para o app num outro dia', async () => {
    let aoMudar: ((estado: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_tipo, ouvinte) => {
      aoMudar = ouvinte as (estado: AppStateStatus) => void;
      return { remove: jest.fn() };
    });
    jest.useFakeTimers({ now: new Date(2026, 9, 2, 23, 50) });

    await render(<Dia />);
    expect(screen.getByText('02/10/2026')).toBeOnTheScreen();

    jest.setSystemTime(new Date(2026, 9, 3, 8, 0));
    await act(async () => aoMudar?.('active'));
    expect(screen.getByText('03/10/2026')).toBeOnTheScreen();
  });
});
