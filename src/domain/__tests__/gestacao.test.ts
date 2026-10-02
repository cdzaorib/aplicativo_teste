import type { ItemLista } from '../tipos';
import {
  eHoraDeComprar,
  faseDaGestacao,
  formatarData,
  itensParaComprarAgora,
  lerDataPrevista,
  mascararData,
  quandoDoItem,
  semanasDeGestacao,
} from '../gestacao';

// 2 de outubro de 2026, meio-dia no horário do aparelho.
const HOJE = new Date(2026, 9, 2, 12);

function item(catalogoId: string | undefined, comprado = false): ItemLista {
  return {
    id: catalogoId ?? 'proprio',
    catalogoId,
    nome: catalogoId ?? 'Item próprio',
    categoria: 'quarto',
    prioridade: 'essencial',
    modelo: '',
    quantidade: 1,
    comprado,
    criadoEm: 1,
    atualizadoEm: 1,
  };
}

describe('semanasDeGestacao', () => {
  it('conta as semanas completas até hoje a partir da data prevista', () => {
    // Faltam 105 dias para 15/01/2027: 280 - 105 = 175 dias, ou seja, 25 semanas.
    expect(semanasDeGestacao('2027-01-15', HOJE)).toBe(25);
    expect(semanasDeGestacao('2026-10-02', HOJE)).toBe(40);
    expect(semanasDeGestacao('2027-07-09', HOJE)).toBe(0);
  });

  it('não depende da hora do dia', () => {
    const quaseMeiaNoite = new Date(2026, 9, 2, 23, 59);
    expect(semanasDeGestacao('2027-01-15', quaseMeiaNoite)).toBe(25);
  });
});

describe('faseDaGestacao', () => {
  it('diz o trimestre ou que a data prevista chegou', () => {
    expect(faseDaGestacao(10)).toBe('1º trimestre');
    expect(faseDaGestacao(14)).toBe('2º trimestre');
    expect(faseDaGestacao(28)).toBe('3º trimestre');
    expect(faseDaGestacao(41)).toBe('Data prevista alcançada');
  });
});

describe('hora de comprar', () => {
  it('começa na fase de cada item', () => {
    expect(eHoraDeComprar('tri2', 13)).toBe(false);
    expect(eHoraDeComprar('tri2', 14)).toBe(true);
    expect(eHoraDeComprar('tri3', 27)).toBe(false);
    expect(eHoraDeComprar('maternidade', 32)).toBe(true);
    expect(eHoraDeComprar('depois', 39)).toBe(false);
    expect(eHoraDeComprar(undefined, 40)).toBe(false);
  });

  it('usa a fase do catálogo e ignora itens comprados e itens próprios', () => {
    const berco = item('berco');
    expect(quandoDoItem(berco)).toBeDefined();
    expect(quandoDoItem(item(undefined))).toBeUndefined();

    const itens = [berco, item('carrinho', true), item(undefined)];
    expect(itensParaComprarAgora(itens, 40)).toEqual([berco]);
    expect(itensParaComprarAgora(itens, 0)).toEqual([]);
  });
});

describe('data prevista', () => {
  it('coloca as barras enquanto a pessoa digita', () => {
    expect(mascararData('15')).toBe('15');
    expect(mascararData('1501')).toBe('15/01');
    expect(mascararData('15012027')).toBe('15/01/2027');
    expect(mascararData('15/01/2027 99')).toBe('15/01/2027');
  });

  it('mostra a data no formato brasileiro', () => {
    expect(formatarData('2027-01-15')).toBe('15/01/2027');
  });

  it('aceita uma data possível e recusa as que não fazem sentido', () => {
    expect(lerDataPrevista('15/01/2027', HOJE)).toEqual({ data: '2027-01-15' });
    expect(lerDataPrevista('15/1/2027', HOJE)).toEqual({
      erro: 'Digite a data no formato DD/MM/AAAA.',
    });
    expect(lerDataPrevista('31/02/2027', HOJE)).toEqual({ erro: 'Essa data não existe.' });
    expect(lerDataPrevista('15/01/2028', HOJE)).toEqual({
      erro: 'A data prevista do parto fica no máximo 10 meses à frente.',
    });
    expect(lerDataPrevista('01/09/2025', HOJE)).toEqual({
      erro: 'Essa data já passou há mais de um ano.',
    });
    // O bebê já nasceu há alguns meses: ainda vale, para as compras de depois do nascimento.
    expect(lerDataPrevista('01/06/2026', HOJE)).toEqual({ data: '2026-06-01' });
  });
});
