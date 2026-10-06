import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  agendarAvisosDaConsulta,
  cancelarAvisosDaConsulta,
  pedirPermissaoDeAvisos,
} from '@/notificacoes/lembretes';
import { useGestacaoStore } from '@/store/gestacao';
import { ProximaConsulta } from '../proxima-consulta';

jest.mock('@/notificacoes/lembretes', () => ({
  LEMBRETES_DISPONIVEIS: true,
  agendarAvisosDaConsulta: jest.fn(() => Promise.resolve(2)),
  cancelarAvisosDaConsulta: jest.fn(() => Promise.resolve()),
  pedirPermissaoDeAvisos: jest.fn(),
}));

/** Data daqui a `dias` dias, como a pessoa digitaria (DD/MM/AAAA). */
function daquiA(dias: number): { digitada: string; guardada: string } {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const d = (n: number) => String(n).padStart(2, '0');
  return {
    digitada: `${d(data.getDate())}${d(data.getMonth() + 1)}${data.getFullYear()}`,
    guardada: `${data.getFullYear()}-${d(data.getMonth() + 1)}-${d(data.getDate())}`,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useGestacaoStore.setState({ proximaConsulta: undefined, perguntasConsulta: '' });
});

describe('ProximaConsulta', () => {
  it('marca a consulta e agenda os avisos com a permissão do celular', async () => {
    jest.mocked(pedirPermissaoDeAvisos).mockResolvedValue(true);
    const dia = daquiA(10);
    await render(<ProximaConsulta />);

    await fireEvent.changeText(screen.getByLabelText('Data da consulta'), dia.digitada);
    await fireEvent.changeText(screen.getByLabelText('Hora'), '1430');
    await fireEvent.press(screen.getByText('Salvar consulta'));

    expect(useGestacaoStore.getState().proximaConsulta).toBe(`${dia.guardada}T14:30`);
    expect(agendarAvisosDaConsulta).toHaveBeenCalledWith(`${dia.guardada}T14:30`);
    expect(screen.getByText(/às 14:30$/)).toBeOnTheScreen();
  });

  it('sem permissão, guarda a consulta e explica como receber os avisos', async () => {
    jest.mocked(pedirPermissaoDeAvisos).mockResolvedValue(false);
    await render(<ProximaConsulta />);

    await fireEvent.changeText(screen.getByLabelText('Data da consulta'), daquiA(3).digitada);
    await fireEvent.changeText(screen.getByLabelText('Hora'), '0900');
    await fireEvent.press(screen.getByText('Salvar consulta'));

    expect(agendarAvisosDaConsulta).not.toHaveBeenCalled();
    // Se havia avisos de uma data anterior, eles saem.
    expect(cancelarAvisosDaConsulta).toHaveBeenCalled();
    expect(screen.getByText(/permita as notificações/)).toBeOnTheScreen();
  });

  it('apaga a consulta e os avisos; consulta que já passou pede a próxima', async () => {
    useGestacaoStore.setState({ proximaConsulta: `${daquiA(5).guardada}T10:00` });
    await render(<ProximaConsulta />);
    await fireEvent.press(screen.getByText('Apagar'));
    expect(useGestacaoStore.getState().proximaConsulta).toBeUndefined();
    expect(cancelarAvisosDaConsulta).toHaveBeenCalled();
  });

  it('avisa que a última consulta passou e guarda as perguntas anotadas', async () => {
    useGestacaoStore.setState({ proximaConsulta: `${daquiA(-2).guardada}T10:00` });
    await render(<ProximaConsulta />);
    expect(screen.getByText(/A última consulta já passou/)).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Perguntas para levar'), 'Posso viajar?');
    expect(useGestacaoStore.getState().perguntasConsulta).toBe('Posso viajar?');
  });
});
