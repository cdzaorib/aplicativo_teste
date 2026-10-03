// Regras da coleta de ofertas da Shopee, sem nada específico do Deno, para rodar também nos
// testes (supabase/testes/coleta.test.mjs).

/** Affiliate Open API da Shopee Brasil (GraphQL, sempre POST). */
export const ENDERECO_API = 'https://open-api.affiliate.shopee.com.br/graphql';

/** Quantas ofertas guardar por item do catálogo. */
export const OFERTAS_POR_ITEM = 5;

/** Quantos produtos pedir à Shopee antes de filtrar os implausíveis. */
const CANDIDATOS = 20;

/** Item do catálogo a buscar, com a faixa de preço comum (supabase/functions/.../catalogo.json). */
export type ItemColeta = {
  id: string;
  busca: string;
  faixa: { minCentavos: number; maxCentavos: number };
};

/** Produto como a Shopee devolve (preços em reais, como texto). */
export type ProdutoShopee = {
  itemId: number | string;
  productName: string;
  priceMin: string;
  priceMax: string;
  productLink: string;
  offerLink?: string;
  imageUrl?: string;
  ratingStar?: string;
  sales?: number;
};

/** Linha da tabela `ofertas`. */
export type LinhaOferta = {
  catalogo_id: string;
  loja: 'shopee';
  produto_id: string;
  nome: string;
  preco_min_centavos: number;
  preco_max_centavos: number;
  link: string;
  imagem_url: string | null;
  avaliacao: number | null;
  vendas: number | null;
  coletado_em: string;
};

/** Linha da tabela `historico_ofertas`. */
export type LinhaHistorico = {
  catalogo_id: string;
  loja: 'shopee';
  dia: string;
  menor_preco_centavos: number;
  mediana_centavos: number;
  quantidade: number;
};

/** Corpo da consulta GraphQL de ofertas por palavra-chave, ordenadas por relevância. */
export function consultaOfertas(termo: string): { query: string } {
  return {
    query: `{ productOfferV2(keyword: ${JSON.stringify(termo)}, sortType: 1, page: 1, limit: ${CANDIDATOS}) { nodes { itemId productName priceMin priceMax productLink offerLink imageUrl ratingStar sales } } }`,
  };
}

/** Assinatura da Shopee: SHA-256 (em hexadecimal) de AppId + Timestamp + corpo + segredo. */
export async function assinar(
  appId: string,
  timestamp: number,
  corpo: string,
  segredo: string,
): Promise<string> {
  const dados = new TextEncoder().encode(`${appId}${timestamp}${corpo}${segredo}`);
  const hash = await crypto.subtle.digest('SHA-256', dados);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function cabecalhoAutorizacao(appId: string, timestamp: number, assinatura: string): string {
  return `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${assinatura}`;
}

/** "59.9" -> 5990. Devolve undefined para valores que não são preço. */
export function reaisParaCentavos(valor: string | number | undefined): number | undefined {
  const numero = typeof valor === 'number' ? valor : Number.parseFloat(valor ?? '');
  return Number.isFinite(numero) && numero > 0 ? Math.round(numero * 100) : undefined;
}

/**
 * Preço plausível para o item: nem muito abaixo da faixa comum (costuma ser acessório, peça ou
 * golpe), nem muito acima (costuma ser kit com várias unidades ou outro produto).
 */
export function precoPlausivel(precoCentavos: number, faixa: ItemColeta['faixa']): boolean {
  return precoCentavos >= faixa.minCentavos * 0.6 && precoCentavos <= faixa.maxCentavos * 2;
}

/** Converte os produtos da Shopee nas melhores ofertas do item, na ordem de relevância. */
export function paraOfertas(
  produtos: ProdutoShopee[],
  item: ItemColeta,
  coletadoEm: string,
): LinhaOferta[] {
  const ofertas: LinhaOferta[] = [];
  const vistos = new Set<string>();
  for (const produto of produtos) {
    const precoMin = reaisParaCentavos(produto.priceMin);
    const produtoId = String(produto.itemId);
    if (!precoMin || !produto.productLink || vistos.has(produtoId)) continue;
    if (!precoPlausivel(precoMin, item.faixa)) continue;
    vistos.add(produtoId);
    const avaliacao = Number.parseFloat(produto.ratingStar ?? '');
    ofertas.push({
      catalogo_id: item.id,
      loja: 'shopee',
      produto_id: produtoId,
      nome: produto.productName.trim(),
      preco_min_centavos: precoMin,
      preco_max_centavos: Math.max(precoMin, reaisParaCentavos(produto.priceMax) ?? precoMin),
      // Link comum do produto: sem afiliado por enquanto. Para usar o de afiliado, troque por
      // produto.offerLink.
      link: produto.productLink,
      imagem_url: produto.imageUrl ?? null,
      avaliacao: Number.isFinite(avaliacao) ? Math.round(avaliacao * 10) / 10 : null,
      vendas: typeof produto.sales === 'number' ? produto.sales : null,
      coletado_em: coletadoEm,
    });
    if (ofertas.length === OFERTAS_POR_ITEM) break;
  }
  return ofertas;
}

/** Menor preço e mediana das ofertas do dia, para o histórico. */
export function resumoDoDia(ofertas: LinhaOferta[], dia: string): LinhaHistorico | undefined {
  if (ofertas.length === 0) return undefined;
  const precos = ofertas.map((oferta) => oferta.preco_min_centavos).sort((a, b) => a - b);
  const meio = Math.floor(precos.length / 2);
  const mediana =
    precos.length % 2 ? precos[meio] : Math.round((precos[meio - 1] + precos[meio]) / 2);
  return {
    catalogo_id: ofertas[0].catalogo_id,
    loja: 'shopee',
    dia,
    menor_preco_centavos: precos[0],
    mediana_centavos: mediana,
    quantidade: precos.length,
  };
}
