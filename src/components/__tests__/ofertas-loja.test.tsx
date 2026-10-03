import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { Oferta } from '@/nuvem/linhas';
import { buscarHistorico, buscarOfertas } from '@/nuvem/ofertas';
import { OfertasLoja } from '../ofertas-loja';

jest.mock('@/nuvem/ofertas', () => ({
  DIAS_HISTORICO: 30,
  buscarOfertas: jest.fn(),
  buscarHistorico: jest.fn(),
}));
jest.mock('expo-image', () => ({ Image: () => null }));

const faixa = { minCentavos: 40000, maxCentavos: 250000 };

const oferta: Oferta = {
  produtoId: '1',
  nome: 'Berço americano Galzerano',
  precoMinCentavos: 89990,
  precoMaxCentavos: 89990,
  link: 'https://shopee.com.br/berco-1',
  avaliacao: 4.9,
  vendas: 1200,
  coletadoEm: Date.UTC(2026, 9, 3, 12),
};

beforeEach(() => {
  jest.mocked(buscarOfertas).mockReset();
  jest.mocked(buscarHistorico).mockReset().mockResolvedValue([]);
});

describe('OfertasLoja', () => {
  it('mostra as ofertas com preço, avaliação e o que achamos do preço', async () => {
    jest.mocked(buscarOfertas).mockResolvedValue([
      oferta,
      {
        ...oferta,
        produtoId: '2',
        nome: 'Berço suspeito',
        precoMinCentavos: 20000,
        avaliacao: undefined,
        vendas: undefined,
      },
    ]);
    await render(<OfertasLoja catalogoId="berco" faixa={faixa} unidade="unidade" />);

    expect(await screen.findByText('Ofertas na Shopee')).toBeOnTheScreen();
    expect(screen.getByText('Berço americano Galzerano')).toBeOnTheScreen();
    expect(screen.getByText('★ 4,9 · 1.200 vendidos')).toBeOnTheScreen();
    expect(screen.getByText('Dentro da faixa comum')).toBeOnTheScreen();
    expect(screen.getByText('Muito abaixo do normal')).toBeOnTheScreen();
    expect(buscarOfertas).toHaveBeenCalledWith('berco');
  });

  it('abre a oferta na loja', async () => {
    jest.mocked(buscarOfertas).mockResolvedValue([oferta]);
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<OfertasLoja catalogoId="berco" faixa={faixa} unidade="unidade" />);

    await fireEvent.press(await screen.findByLabelText(/Abrir na Shopee/));
    expect(abrir).toHaveBeenCalledWith('https://shopee.com.br/berco-1');
  });

  it('não mostra nada enquanto não há ofertas ou sem internet', async () => {
    jest.mocked(buscarOfertas).mockRejectedValue(new Error('sem internet'));
    await render(<OfertasLoja catalogoId="berco" faixa={faixa} unidade="unidade" />);
    expect(screen.queryByText('Ofertas na Shopee')).toBeNull();
  });

  it('mostra o menor preço dos últimos dias quando há histórico', async () => {
    jest.mocked(buscarOfertas).mockResolvedValue([oferta]);
    jest.mocked(buscarHistorico).mockResolvedValue([
      { dia: '2026-09-20', menorPrecoCentavos: 79990, medianaCentavos: 85000 },
      { dia: '2026-10-03', menorPrecoCentavos: 89990, medianaCentavos: 95000 },
    ]);
    await render(<OfertasLoja catalogoId="berco" faixa={faixa} unidade="unidade" />);

    const texto = await screen.findByText(/Menor preço nos últimos 30 dias/);
    expect(texto.props.children.join('').replace(/\u00a0/g, ' ')).toContain(
      'R$ 799,90 em 20/09/2026. Hoje: R$ 899,90.',
    );
  });
});
