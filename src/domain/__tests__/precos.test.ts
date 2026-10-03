import { CATALOGO } from '../catalogo';
import { FAIXAS_PESQUISADAS } from '../faixas-preco';
import {
  avaliarPreco,
  explicarAvaliacao,
  linkDeBusca,
  MINIMO_INFORMADOS,
  referenciaDePreco,
  unidadeDePreco,
} from '../precos';

const faixa = { minCentavos: 40000, maxCentavos: 100000 };

describe('avaliarPreco', () => {
  it.each([
    [10000, 'suspeito'],
    [23999, 'suspeito'],
    [24000, 'barato'],
    [39999, 'barato'],
    [40000, 'normal'],
    [100000, 'normal'],
    [100001, 'caro'],
  ] as const)('R$ %i centavos é "%s"', (preco, esperado) => {
    expect(avaliarPreco(preco, faixa)).toBe(esperado);
  });

  it('cita o Inmetro só quando o item exige o selo', () => {
    expect(explicarAvaliacao('suspeito', true)).toContain('Inmetro');
    expect(explicarAvaliacao('suspeito', false)).not.toContain('Inmetro');
  });
});

describe('referenciaDePreco', () => {
  const pesquisada = { minCentavos: 100, maxCentavos: 200 };

  it('usa a pesquisa enquanto há poucos preços informados', () => {
    const informados = { quantidade: MINIMO_INFORMADOS - 1, p25Centavos: 150, p75Centavos: 180 };
    expect(referenciaDePreco(pesquisada, informados)).toEqual({
      faixa: pesquisada,
      origem: 'pesquisa',
    });
  });

  it('passa a usar os preços informados quando há gente suficiente', () => {
    const informados = { quantidade: MINIMO_INFORMADOS, p25Centavos: 150, p75Centavos: 180 };
    expect(referenciaDePreco(pesquisada, informados)).toEqual({
      faixa: { minCentavos: 150, maxCentavos: 180 },
      origem: 'informados',
      quantidade: MINIMO_INFORMADOS,
    });
  });

  it('usa os preços informados mesmo sem pesquisa', () => {
    const informados = { quantidade: 8, p25Centavos: 150, p75Centavos: 180 };
    expect(referenciaDePreco(undefined, informados)?.origem).toBe('informados');
  });

  it('não inventa referência quando não há dados', () => {
    expect(referenciaDePreco()).toBeUndefined();
  });
});

describe('linkDeBusca', () => {
  it('monta a busca de cada loja', () => {
    expect(linkDeBusca('mercadolivre', 'Berço infantil')).toBe(
      'https://lista.mercadolivre.com.br/berco-infantil',
    );
    expect(linkDeBusca('amazon', 'berço infantil')).toBe(
      'https://www.amazon.com.br/s?k=ber%C3%A7o%20infantil',
    );
    expect(linkDeBusca('magalu', 'berço infantil')).toBe(
      'https://www.magazineluiza.com.br/busca/ber%C3%A7o+infantil/',
    );
    expect(linkDeBusca('shopee', 'berço infantil')).toBe(
      'https://shopee.com.br/search?keyword=ber%C3%A7o%20infantil',
    );
  });
});

describe('faixas pesquisadas', () => {
  it('só existem para itens do catálogo que podem ser comprados', () => {
    const compraveis = new Set(
      CATALOGO.filter((item) => item.prioridade !== 'evitar').map((item) => item.id),
    );
    expect(Object.keys(FAIXAS_PESQUISADAS).filter((id) => !compraveis.has(id))).toEqual([]);
  });

  it('cobrem todos os itens do catálogo que podem ser comprados', () => {
    const semFaixa = CATALOGO.filter(
      (item) => item.prioridade !== 'evitar' && !FAIXAS_PESQUISADAS[item.id],
    );
    expect(semFaixa.map((item) => item.id)).toEqual([]);
  });

  it('têm mínimo positivo e menor que o máximo', () => {
    for (const [id, faixaItem] of Object.entries(FAIXAS_PESQUISADAS)) {
      expect({
        id,
        valida: faixaItem!.minCentavos > 0 && faixaItem!.minCentavos < faixaItem!.maxCentavos,
      }).toEqual({ id, valida: true });
    }
  });
});

describe('unidadeDePreco', () => {
  it('usa a unidade do catálogo e, sem ela, conta por unidade', () => {
    expect(unidadeDePreco('meias')).toBe('par');
    expect(unidadeDePreco('fralda-p')).toBe('pacote');
    expect(unidadeDePreco('protetor-tomada')).toBe('kit');
    expect(unidadeDePreco('berco')).toBe('unidade');
    expect(unidadeDePreco(undefined)).toBe('unidade');
    expect(unidadeDePreco('item-que-nao-existe')).toBe('unidade');
  });
});
