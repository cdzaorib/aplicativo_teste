import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ItemLista } from '@/domain/tipos';
import {
  agendarLembretes,
  cancelarLembretes,
  pedirPermissaoDeAvisos,
} from '@/notificacoes/lembretes';
import { useGestacaoStore } from '@/store/gestacao';
import { QuandoComprar } from '../quando-comprar';

jest.mock('@/notificacoes/lembretes', () => ({
  LEMBRETES_DISPONIVEIS: true,
  agendarLembretes: jest.fn(() => Promise.resolve(3)),
  cancelarLembretes: jest.fn(() => Promise.resolve()),
  pedirPermissaoDeAvisos: jest.fn(),
}));

/** Data daqui a `dias` dias, como a pessoa digitaria (DD/MM/AAAA). */
function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return `${doisDigitos(data.getDate())}${doisDigitos(data.getMonth() + 1)}${data.getFullYear()}`;
}

function item(catalogoId: string, comprado = false): ItemLista {
  return {
    id: catalogoId,
    catalogoId,
    nome: catalogoId,
    categoria: 'quarto',
    prioridade: 'essencial',
    modelo: '',
    quantidade: 1,
    comprado,
    criadoEm: 1,
    atualizadoEm: 1,
  };
}

beforeEach(() => {
  useGestacaoStore.setState({ dataPrevista: undefined, lembretes: false });
  jest.mocked(agendarLembretes).mockClear();
  jest.mocked(cancelarLembretes).mockClear();
  jest.mocked(pedirPermissaoDeAvisos).mockReset();
});

describe('QuandoComprar', () => {
  it('pede a data prevista e mostra a fase e o que comprar agora', async () => {
    // Berço é do 2º trimestre, touca é de antes da maternidade e o carrinho já foi comprado.
    const itens = [item('berco'), item('touca'), item('carrinho', true)];
    await render(<QuandoComprar itens={itens} />);
    expect(screen.getByText(/A data fica só neste aparelho/)).toBeOnTheScreen();

    // Faltam 105 dias: 25 semanas, 2º trimestre.
    await fireEvent.changeText(screen.getByLabelText('Data prevista do parto'), daquiA(105));
    await fireEvent.press(screen.getByText('Salvar data'));

    expect(screen.getByText('25 semanas · 2º trimestre')).toBeOnTheScreen();
    expect(
      screen.getByText('1 item para comprar agora, marcado com "Hora de comprar".'),
    ).toBeOnTheScreen();
    expect(useGestacaoStore.getState().dataPrevista).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('avisa quando a data não faz sentido', async () => {
    await render(<QuandoComprar itens={[]} />);

    await fireEvent.changeText(screen.getByLabelText('Data prevista do parto'), '31022027');
    await fireEvent.press(screen.getByText('Salvar data'));

    expect(screen.getByText('Essa data não existe.')).toBeOnTheScreen();
    expect(useGestacaoStore.getState().dataPrevista).toBeUndefined();
  });

  it('permite apagar a data', async () => {
    useGestacaoStore.setState({ dataPrevista: '2027-01-15' });
    await render(<QuandoComprar itens={[]} />);

    await fireEvent.press(screen.getByText('Alterar'));
    await fireEvent.press(screen.getByText('Apagar data'));

    expect(useGestacaoStore.getState().dataPrevista).toBeUndefined();
    expect(screen.getByText('Salvar data')).toBeOnTheScreen();
  });

  it('liga os avisos de fase com a permissão do celular', async () => {
    useGestacaoStore.setState({ dataPrevista: '2027-01-15' });
    jest.mocked(pedirPermissaoDeAvisos).mockResolvedValue(true);
    await render(<QuandoComprar itens={[]} />);

    await fireEvent(
      screen.getByLabelText('Avisar quando começar cada fase de compras'),
      'valueChange',
      true,
    );

    expect(agendarLembretes).toHaveBeenCalledWith('2027-01-15');
    expect(useGestacaoStore.getState().lembretes).toBe(true);
  });

  it('explica o que fazer se a pessoa não permitir notificações', async () => {
    useGestacaoStore.setState({ dataPrevista: '2027-01-15' });
    jest.mocked(pedirPermissaoDeAvisos).mockResolvedValue(false);
    await render(<QuandoComprar itens={[]} />);

    await fireEvent(
      screen.getByLabelText('Avisar quando começar cada fase de compras'),
      'valueChange',
      true,
    );

    expect(screen.getByText(/permita as notificações do app nos ajustes/)).toBeOnTheScreen();
    expect(agendarLembretes).not.toHaveBeenCalled();
    expect(useGestacaoStore.getState().lembretes).toBe(false);
  });

  it('reagenda os avisos quando a data muda e cancela quando é apagada', async () => {
    useGestacaoStore.setState({ dataPrevista: '2027-01-15', lembretes: true });
    await render(<QuandoComprar itens={[]} />);

    await fireEvent.press(screen.getByText('Alterar'));
    await fireEvent.changeText(screen.getByLabelText('Data prevista do parto'), daquiA(100));
    await fireEvent.press(screen.getByText('Salvar data'));
    expect(agendarLembretes).toHaveBeenCalledWith(useGestacaoStore.getState().dataPrevista);

    await fireEvent.press(screen.getByText('Alterar'));
    await fireEvent.press(screen.getByText('Apagar data'));
    expect(cancelarLembretes).toHaveBeenCalled();
  });
});
