import { listaComoTexto } from '../texto-lista';
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

/** O Intl usa espaço não separável depois do "R$"; aqui comparamos com espaço comum. */
const normalizar = (texto: string) => texto.replace(/ /g, ' ');

describe('listaComoTexto', () => {
  it('separa o que falta do que já foi comprado, por prioridade, com os totais', () => {
    const texto = listaComoTexto([
      item({ id: '1', nome: 'Body', quantidade: 6, precoCentavos: 2000 }),
      item({
        id: '2',
        nome: 'Berço',
        modelo: 'Mini',
        prioridade: 'essencial',
        precoCentavos: 89990,
      }),
      item({ id: '3', nome: 'Banheira', comprado: true, precoCentavos: 5000 }),
      item({ id: '4', nome: 'Manta' }),
    ]);

    expect(normalizar(texto)).toBe(
      [
        '*Lista do enxoval*',
        ['Falta comprar (3):', '• Berço (Mini): R$ 899,90', '• 6x Body: R$ 120,00', '• Manta'].join(
          '\n',
        ),
        ['Já comprado (1):', '✓ Banheira: R$ 50,00'].join('\n'),
        'Previsto: R$ 1.069,90 · Gasto: R$ 50,00',
      ].join('\n\n'),
    );
  });

  it('funciona com a lista vazia', () => {
    expect(normalizar(listaComoTexto([]))).toBe(
      '*Lista do enxoval*\n\nPrevisto: R$ 0,00 · Gasto: R$ 0,00',
    );
  });
});
