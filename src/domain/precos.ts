import { CATALOGO } from './catalogo';
import type { UnidadePreco } from './tipos';

/** Faixa de preço comum de um item, na unidade do item (ver `unidadeDePreco`). */
export type FaixaPreco = { minCentavos: number; maxCentavos: number };

/** Resumo dos preços informados por quem usa o app (vem do Supabase, só agregado). */
export type EstatisticaPrecos = { quantidade: number; p25Centavos: number; p75Centavos: number };

export type Referencia = {
  faixa: FaixaPreco;
  origem: 'pesquisa' | 'informados';
  quantidade?: number;
};

export type Avaliacao = 'suspeito' | 'barato' | 'normal' | 'caro';

/** Mínimo de pessoas informando preços para a referência delas substituir a pesquisa. */
export const MINIMO_INFORMADOS = 5;

/** Abaixo desta fração do mínimo da faixa, o preço é bom demais para ser verdade. */
export const FRACAO_SUSPEITA = 0.6;

/**
 * Escolhe a referência de preço de um item: os preços informados pelas pessoas, quando há
 * gente suficiente, ou a faixa pesquisada. Sem nenhuma das duas, não há referência.
 */
export function referenciaDePreco(
  pesquisada?: FaixaPreco,
  informados?: EstatisticaPrecos,
): Referencia | undefined {
  if (informados && informados.quantidade >= MINIMO_INFORMADOS) {
    return {
      faixa: { minCentavos: informados.p25Centavos, maxCentavos: informados.p75Centavos },
      origem: 'informados',
      quantidade: informados.quantidade,
    };
  }
  if (pesquisada) return { faixa: pesquisada, origem: 'pesquisa' };
  return undefined;
}

const UNIDADE_DO_CATALOGO = new Map(CATALOGO.map((item) => [item.id, item.precoPor]));

/** Como o preço do item é contado (por par, por pacote...). Itens próprios contam por unidade. */
export function unidadeDePreco(catalogoId: string | undefined): UnidadePreco {
  return (catalogoId && UNIDADE_DO_CATALOGO.get(catalogoId)) || 'unidade';
}

export function avaliarPreco(precoCentavos: number, faixa: FaixaPreco): Avaliacao {
  if (precoCentavos < faixa.minCentavos * FRACAO_SUSPEITA) return 'suspeito';
  if (precoCentavos < faixa.minCentavos) return 'barato';
  if (precoCentavos <= faixa.maxCentavos) return 'normal';
  return 'caro';
}

export const TITULOS_AVALIACAO: Record<Avaliacao, string> = {
  suspeito: 'Muito abaixo do normal',
  barato: 'Abaixo da faixa comum',
  normal: 'Dentro da faixa comum',
  caro: 'Acima da faixa comum',
};

export function explicarAvaliacao(avaliacao: Avaliacao, exigeInmetro = false): string {
  switch (avaliacao) {
    case 'suspeito':
      return exigeInmetro
        ? 'Desconfie: pode ser golpe, produto usado ou sem o selo do Inmetro.'
        : 'Desconfie: pode ser golpe ou produto usado. Confira a loja antes de comprar.';
    case 'barato':
      return 'Bom preço. Confira se é o mesmo produto e se a loja é confiável.';
    case 'normal':
      return 'Preço dentro do que costuma ser cobrado.';
    case 'caro':
      return 'Vale pesquisar mais antes de comprar.';
  }
}

export type Loja = 'mercadolivre' | 'amazon' | 'magalu' | 'shopee';

export const LOJAS: Record<Loja, string> = {
  mercadolivre: 'Mercado Livre',
  amazon: 'Amazon',
  magalu: 'Magalu',
  shopee: 'Shopee',
};

/** Onde a pessoa achou o preço que está informando. */
export type OrigemPreco = Loja | 'loja-fisica' | 'outra';

export const ORIGENS_PRECO: Record<OrigemPreco, string> = {
  ...LOJAS,
  'loja-fisica': 'Loja física',
  outra: 'Outra',
};

const semAcentos = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Link para a busca do item no site da loja. */
export function linkDeBusca(loja: Loja, termo: string): string {
  const busca = encodeURIComponent(termo.trim());
  switch (loja) {
    case 'mercadolivre':
      return `https://lista.mercadolivre.com.br/${encodeURIComponent(
        semAcentos(termo.trim().toLowerCase()).replace(/\s+/g, '-'),
      )}`;
    case 'amazon':
      return `https://www.amazon.com.br/s?k=${busca}`;
    case 'magalu':
      return `https://www.magazineluiza.com.br/busca/${busca.replace(/%20/g, '+')}/`;
    case 'shopee':
      return `https://shopee.com.br/search?keyword=${busca}`;
  }
}
