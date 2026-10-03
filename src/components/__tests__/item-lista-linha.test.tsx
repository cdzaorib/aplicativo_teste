import { render, screen } from '@testing-library/react-native';

import type { ItemLista } from '@/domain/tipos';
import { ItemListaLinha } from '../item-lista-linha';

const berco: ItemLista = {
  id: 'b1',
  catalogoId: 'berco',
  nome: 'Berço',
  categoria: 'quarto',
  prioridade: 'essencial',
  modelo: '',
  quantidade: 1,
  comprado: true,
  compradoPor: 'paulo-id',
  criadoEm: 1,
  atualizadoEm: 1,
};

describe('ItemListaLinha', () => {
  it('mostra quem comprou numa lista compartilhada', async () => {
    await render(<ItemListaLinha item={berco} onAlternar={jest.fn()} compradoPor="Paulo" />);
    expect(screen.getByText('Comprado por Paulo')).toBeOnTheScreen();
  });

  it('não mostra comprador quando não há nome (lista própria ou compra da própria pessoa)', async () => {
    await render(<ItemListaLinha item={berco} onAlternar={jest.fn()} />);
    expect(screen.queryByText(/Comprado por/)).toBeNull();
  });
});
