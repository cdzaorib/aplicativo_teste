import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { Oferta } from '@/nuvem/linhas';
import { buscarOfertas } from '@/nuvem/ofertas';
import { OfertasLoja } from '../ofertas-loja';

jest.mock('@/nuvem/ofertas', () => ({ buscarOfertas: jest.fn() }));
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
});
