import {
  deListaPresentes,
  linkDosPresentes,
  mensagemDosPresentes,
  ordenarPresentes,
  type ItemPresente,
} from '../presentes';

const presente = (id: string, nome: string, situacao: ItemPresente['situacao']): ItemPresente => ({
  id,
  nome,
  modelo: '',
  quantidade: 1,
  categoria: 'quarto',
  situacao,
});

describe('lista de presentes', () => {
  it('lê o que o banco devolve, e null quer dizer link inválido', () => {
    expect(deListaPresentes(null)).toBeNull();
    expect(
      deListaPresentes({
        nome: null,
        itens: [
          {
            id: 'b1',
            catalogo_id: 'berco',
            nome: 'Berço',
            modelo: 'Mini',
            quantidade: 1,
            categoria: 'quarto',
            situacao: 'livre',
          },
          {
            id: 'x',
            catalogo_id: null,
            nome: 'Móbile',
            modelo: '',
            quantidade: 2,
            categoria: 'quarto',
            situacao: 'reservado',
          },
        ],
      }),
    ).toEqual({
      itens: [
        {
          id: 'b1',
          catalogoId: 'berco',
          nome: 'Berço',
          modelo: 'Mini',
          quantidade: 1,
          categoria: 'quarto',
          situacao: 'livre',
        },
        {
          id: 'x',
          nome: 'Móbile',
          modelo: '',
          quantidade: 2,
          categoria: 'quarto',
          situacao: 'reservado',
        },
      ],
    });
  });

  it('mostra primeiro o que ainda está livre, em ordem alfabética', () => {
    const ordem = ordenarPresentes([
      presente('1', 'Banheira', 'reservado'),
      presente('2', 'Mamadeira', 'livre'),
      presente('3', 'Berço', 'comprado'),
      presente('4', 'Babador', 'livre'),
    ]).map((p) => p.nome);
    expect(ordem).toEqual(['Babador', 'Mamadeira', 'Banheira', 'Berço']);
  });

  it('monta o link só quando há endereço da versão web', () => {
    expect(linkDosPresentes('https://enxoval.app/', 'ABCD')).toBe(
      'https://enxoval.app/presente/ABCD',
    );
    expect(linkDosPresentes(undefined, 'ABCD')).toBeUndefined();
  });

  it('a mensagem leva o link e o nome, se houver', () => {
    expect(mensagemDosPresentes('https://x/presente/A', 'Gabi')).toMatch(
      /^Lista de presentes do chá de bebê de Gabi: https:\/\/x\/presente\/A/,
    );
    expect(mensagemDosPresentes('https://x/presente/A')).toMatch(
      /^Lista de presentes do chá de bebê: /,
    );
  });
});
