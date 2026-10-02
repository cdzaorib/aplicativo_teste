import type { FaixaPreco } from './precos';

/**
 * Faixas de preço comuns pesquisadas em out/2026, em guias de preço de enxoval e em resultados
 * de busca de lojas online (Amazon, Mercado Livre, Magalu, farmácias e lojas de bebê).
 *
 * São aproximadas: servem de ponto de partida até haver preços informados por quem usa o app
 * (ver `referenciaDePreco`). Itens sem dado confiável ficam de fora em vez de receber um chute.
 * Valores por unidade, ou por pacote quando o nome do item diz "pacote".
 */
export const PESQUISA_PRECOS_EM = 'out/2026';

const reais = (min: number, max: number): FaixaPreco => ({
  minCentavos: min * 100,
  maxCentavos: max * 100,
});

export const FAIXAS_PESQUISADAS: Partial<Record<string, FaixaPreco>> = {
  // Quarto e sono
  berco: reais(400, 2500),
  'colchao-berco': reais(75, 170),
  'lencol-elastico': reais(25, 120),
  'comoda-trocador': reais(320, 750),
  'baba-eletronica': reais(170, 700),
  'berco-portatil': reais(370, 920),

  // Passeio e transporte
  'bebe-conforto': reais(250, 900),
  carrinho: reais(400, 2000),
  canguru: reais(60, 300),

  // Higiene e banho
  'sabonete-neutro': reais(15, 35),
  'pomada-assadura': reais(20, 45),
  'fralda-rn': reais(20, 40),
  'fralda-p': reais(35, 75),

  // Alimentação e amamentação
  'bomba-leite': reais(45, 350),
  esterilizador: reais(15, 250),
  'cadeira-alimentacao': reais(150, 750),
  'sutia-amamentacao': reais(25, 150),

  // Mala da maternidade
  'camisola-abertura': reais(55, 100),

  // Saúde
  termometro: reais(17, 130),
};
