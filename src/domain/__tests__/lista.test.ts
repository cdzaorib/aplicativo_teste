import { formatarPreco, lerPreco, ordenarLista, precoParaTexto, resumirLista } from '../lista';
import type { ItemLista } from '../tipos';

function item(dados: Partial<ItemLista> & Pick<ItemLista, 'id' | 'nome'>): ItemLista {
  return {
    categoria: 'quarto',
    prioridade: 'util',
    modelo: '',
    quantidade: 1,
    comprado: false,
    criadoEm: 0,
    atualizadoEm: 0,
    ...dados,
  };
}

const nomes = (itens: ItemLista[]) => itens.map((i) => i.nome);

describe('ordenarLista', () => {
  const itens = [
    item({
      id: '1',
      nome: 'Banheira',
      precoCentavos: 15000,
      modelo: 'Zeta',
      prioridade: 'essencial',
      categoria: 'higiene',
    }),
    item({ id: '2', nome: 'Abajur', precoCentavos: 8000, prioridade: 'opcional' }),
    item({
      id: '3',
      nome: 'Carrinho',
      precoCentavos: 90000,
      modelo: 'Alfa',
      categoria: 'passeio',
      comprado: true,
    }),
    item({ id: '4', nome: 'berço', modelo: 'Beta', prioridade: 'essencial' }),
  ];

  it('ordena por nome ignorando maiúsculas e acentos, com comprados no fim', () => {
    expect(nomes(ordenarLista(itens, 'nome'))).toEqual(['Abajur', 'Banheira', 'berço', 'Carrinho']);
  });

  it('ordena por valor com itens sem preço no fim', () => {
    expect(nomes(ordenarLista(itens, 'valor'))).toEqual([
      'Abajur',
      'Banheira',
      'berço',
      'Carrinho',
    ]);
  });

  it('ordena por modelo com itens sem modelo no fim', () => {
    expect(nomes(ordenarLista(itens, 'modelo'))).toEqual([
      'berço',
      'Banheira',
      'Abajur',
      'Carrinho',
    ]);
  });

  it('ordena por prioridade e desempata pelo nome', () => {
    expect(nomes(ordenarLista(itens, 'prioridade'))).toEqual([
      'Banheira',
      'berço',
      'Abajur',
      'Carrinho',
    ]);
  });

  it('ordena por categoria', () => {
    expect(nomes(ordenarLista(itens, 'categoria'))).toEqual([
      'Banheira',
      'Abajur',
      'berço',
      'Carrinho',
    ]);
  });

  it('não altera a lista original', () => {
    const copia = [...itens];
    ordenarLista(itens, 'valor');
    expect(itens).toEqual(copia);
  });
});

describe('resumirLista', () => {
  it('soma previsto e gasto considerando a quantidade', () => {
    const resumo = resumirLista([
      item({ id: '1', nome: 'Body', precoCentavos: 2990, quantidade: 6 }),
      item({ id: '2', nome: 'Berço', precoCentavos: 79900, comprado: true }),
      item({ id: '3', nome: 'Manta' }),
    ]);
    expect(resumo).toEqual({
      total: 3,
      comprados: 1,
      previstoCentavos: 2990 * 6 + 79900,
      gastoCentavos: 79900,
      semPreco: 1,
    });
  });

  it('retorna zeros para lista vazia', () => {
    expect(resumirLista([])).toEqual({
      total: 0,
      comprados: 0,
      previstoCentavos: 0,
      gastoCentavos: 0,
      semPreco: 0,
    });
  });
});

describe('lerPreco', () => {
  it.each([
    ['149,90', 14990],
    ['1.234,56', 123456],
    ['1234.56', 123456],
    ['10.5', 1050],
    ['1.234', 123400],
    ['R$ 99', 9900],
    [' 0,5 ', 50],
  ])('lê "%s" como %i centavos', (texto, centavos) => {
    expect(lerPreco(texto)).toBe(centavos);
  });

  it.each(['', '   ', 'abc', '-5', '1,234,5', '10,999'])('rejeita "%s"', (texto) => {
    expect(lerPreco(texto)).toBeUndefined();
  });
});

describe('formatação de preço', () => {
  it('formata em reais', () => {
    expect(formatarPreco(123456).replace(/\s/g, ' ')).toBe('R$ 1.234,56');
  });

  it('converte centavos para o texto do campo e volta', () => {
    expect(precoParaTexto(14990)).toBe('149,90');
    expect(precoParaTexto(undefined)).toBe('');
    expect(lerPreco(precoParaTexto(123456))).toBe(123456);
  });
});
