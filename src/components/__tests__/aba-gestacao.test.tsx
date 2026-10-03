import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import GestacaoScreen from '@/app/(tabs)/gestacao';
import { TOTAL_ITENS_MALA } from '@/domain/mala-maternidade';
import { useGestacaoStore } from '@/store/gestacao';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/notificacoes/lembretes', () => ({
  LEMBRETES_DISPONIVEIS: false,
  agendarLembretes: jest.fn(),
  cancelarLembretes: jest.fn(() => Promise.resolve()),
}));

/** Data prevista para que hoje a gestação esteja com `semanas` semanas completas. */
function dataPrevistaPara(semanas: number): string {
  const data = new Date();
  data.setDate(data.getDate() + 280 - semanas * 7);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

describe('aba Gestação', () => {
  it('sem a data prevista, pede a data e já mostra o aviso, o pré-natal e os sinais de alerta', async () => {
    useGestacaoStore.setState({ dataPrevista: undefined });
    await render(<GestacaoScreen />);
    expect(screen.getByText(/não substitui o pré-natal/)).toBeOnTheScreen();
    expect(screen.getByText('Sua gestação')).toBeOnTheScreen();
    expect(screen.getByText('Comece o pré-natal')).toBeOnTheScreen();
    expect(screen.getByText('Curiosidade do dia')).toBeOnTheScreen();
    expect(screen.getByText(/Procure atendimento na hora/)).toBeOnTheScreen();
    expect(screen.getByText('192 (SAMU)')).toBeOnTheScreen();
  });

  it('com a data prevista, mostra a semana e os lembretes da fase', async () => {
    useGestacaoStore.setState({ dataPrevista: dataPrevistaPara(25) });
    await render(<GestacaoScreen />);
    expect(screen.getByText(/^25 semanas e 0 dias/)).toBeOnTheScreen();
    expect(screen.getByText(/Faltam 15 semanas e 0 dias/)).toBeOnTheScreen();
    expect(screen.getByText('Exame de glicose')).toBeOnTheScreen();
    expect(screen.getByText('Vacina dTpa')).toBeOnTheScreen();
    expect(screen.getByText('Curiosidade da semana')).toBeOnTheScreen();
    expect(screen.queryByText('Comece o pré-natal')).toBeNull();
  });

  it('mostra quanto da mala da maternidade está pronto e abre a lista', async () => {
    useGestacaoStore.setState({ dataPrevista: '2027-03-30', malaPronta: ['doc-caderneta'] });
    await render(<GestacaoScreen />);
    expect(
      screen.getByText(`1 de ${TOTAL_ITENS_MALA} itens prontos. Deixe tudo pronto até 09/03/2027.`),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Ver o que levar'));
    expect(router.push).toHaveBeenCalledWith('/mala');
  });
});
