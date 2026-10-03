import type { RegistroNuvem } from '@/domain/sincronizacao';
import { deLinha, deLinhaInfoLista, deLinhaOferta, deLinhasReferencia, paraLinha } from '../linhas';

const completo: RegistroNuvem = {
  id: 'abc',
  catalogoId: 'berco',
  nome: 'Berço',
  categoria: 'quarto',
  prioridade: 'essencial',
  modelo: 'Mini',
  precoCentavos: 79990,
  quantidade: 1,
  comprado: true,
  removido: false,
  criadoEm: Date.UTC(2026, 9, 2, 12, 0, 0, 123),
  atualizadoEm: Date.UTC(2026, 9, 2, 13, 30, 0, 456),
};

describe('conversão entre item e linha da tabela', () => {
  it('usa os nomes de coluna do banco e datas ISO', () => {
    expect(paraLinha(completo, 'lista-1')).toEqual({
      id: 'abc',
      lista_id: 'lista-1',
      catalogo_id: 'berco',
      nome: 'Berço',
      categoria: 'quarto',
      prioridade: 'essencial',
      modelo: 'Mini',
      preco_centavos: 79990,
      quantidade: 1,
      comprado: true,
      removido: false,
      criado_em: '2026-10-02T12:00:00.123Z',
      atualizado_em: '2026-10-02T13:30:00.456Z',
    });
  });

  it('volta ao mesmo item, inclusive com as datas no formato que o Supabase devolve', () => {
    const linha = {
      ...paraLinha(completo, 'lista-1'),
      comprado_por: null,
      criado_em: '2026-10-02T12:00:00.123+00:00',
      atualizado_em: '2026-10-02T13:30:00.456+00:00',
    };
    expect(deLinha(linha)).toEqual(completo);
  });

  it('traz quem comprou, que só o banco preenche', () => {
    const linha = { ...paraLinha(completo, 'lista-1'), comprado_por: 'pessoa-1' };
    expect(deLinha(linha)).toEqual({ ...completo, compradoPor: 'pessoa-1' });
    expect(paraLinha({ ...completo, compradoPor: 'pessoa-1' }, 'lista-1')).not.toHaveProperty(
      'comprado_por',
    );
  });

  it('trata campos opcionais vazios', () => {
    const { catalogoId: _c, precoCentavos: _p, ...semOpcionais } = completo;
    const linha = paraLinha(semOpcionais, 'lista-1');

    expect(linha).toMatchObject({ catalogo_id: null, preco_centavos: null });
    expect(deLinha({ ...linha, comprado_por: null })).toEqual(semOpcionais);
  });
});

describe('referências de preço vindas do banco', () => {
  it('vira um mapa por item do catálogo', () => {
    expect(
      deLinhasReferencia([
        { catalogo_id: 'berco', quantidade: 7, p25_centavos: 60000, p75_centavos: 80000 },
      ]),
    ).toEqual({ berco: { quantidade: 7, p25Centavos: 60000, p75Centavos: 80000 } });
  });
});

describe('dados da lista vindos do banco', () => {
  it('a dona recebe o código de convite', () => {
    expect(
      deLinhaInfoLista({
        lista_id: 'l1',
        e_dona: true,
        pode_editar_lista: true,
        pode_editar_precos: true,
        codigo_convite: 'K7P2QX9M',
        nome_dona: 'Gabi',
      }),
    ).toEqual({
      id: 'l1',
      souDona: true,
      podeEditarLista: true,
      podeEditarPrecos: true,
      codigoConvite: 'K7P2QX9M',
      nomeDona: 'Gabi',
    });
  });

  it('o convidado não recebe código', () => {
    expect(
      deLinhaInfoLista({
        lista_id: 'l1',
        e_dona: false,
        pode_editar_lista: false,
        pode_editar_precos: true,
        codigo_convite: null,
        nome_dona: null,
      }),
    ).toEqual({ id: 'l1', souDona: false, podeEditarLista: false, podeEditarPrecos: true });
  });
});

describe('deLinhaOferta', () => {
  it('converte a linha do banco, aceitando avaliação como texto e campos vazios', () => {
    expect(
      deLinhaOferta({
        produto_id: '1',
        nome: 'Berço',
        preco_min_centavos: 89990,
        preco_max_centavos: 99990,
        link: 'https://shopee.com.br/berco-1',
        imagem_url: null,
        avaliacao: '4.9',
        vendas: null,
        coletado_em: '2026-10-03T12:00:00.000Z',
      }),
    ).toEqual({
      produtoId: '1',
      nome: 'Berço',
      precoMinCentavos: 89990,
      precoMaxCentavos: 99990,
      link: 'https://shopee.com.br/berco-1',
      avaliacao: 4.9,
      coletadoEm: Date.UTC(2026, 9, 3, 12),
    });
  });
});
