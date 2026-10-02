import { fireEvent, render, screen } from '@testing-library/react-native';

import { ItemForm, type ValoresItem } from '../item-form';

const inicial: ValoresItem = {
  nome: 'Berço',
  modelo: 'Mini',
  categoria: 'quarto',
  prioridade: 'essencial',
  quantidade: 1,
  precoCentavos: 50000,
  comprado: false,
};

describe('ItemForm com permissões', () => {
  it('na própria lista edita tudo', async () => {
    await render(<ItemForm inicial={inicial} mostrarComprado onSalvar={jest.fn()} />);
    expect(screen.getByLabelText('Nome')).toBeEnabled();
    expect(screen.getByLabelText('Preço unitário (R$)')).toBeEnabled();
  });

  it('quem só edita preços altera apenas o preço', async () => {
    const onSalvar = jest.fn();
    await render(
      <ItemForm inicial={inicial} mostrarComprado permissao="precos" onSalvar={onSalvar} />,
    );

    expect(screen.getByLabelText('Nome')).toBeDisabled();
    expect(screen.getByLabelText('Modelo ou marca')).toBeDisabled();
    expect(screen.getByLabelText('Já comprei')).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Preço unitário (R$)'), '450,00');
    await fireEvent.press(screen.getByText('Salvar'));
    expect(onSalvar).toHaveBeenCalledWith({ ...inicial, precoCentavos: 45000 });
  });

  it('quem só visualiza não consegue salvar', async () => {
    await render(
      <ItemForm inicial={inicial} mostrarComprado permissao="leitura" onSalvar={jest.fn()} />,
    );
    expect(screen.getByLabelText('Preço unitário (R$)')).toBeDisabled();
    expect(screen.queryByText('Salvar')).toBeNull();
    expect(screen.getByText(/só visualizar/)).toBeOnTheScreen();
  });
});
