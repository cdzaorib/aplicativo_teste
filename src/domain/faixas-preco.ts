import type { FaixaPreco } from './precos';

/**
 * Faixas de preço comuns pesquisadas em out/2026, em guias de preço de enxoval e em resultados
 * de busca de lojas online (Amazon, Mercado Livre, Magalu, farmácias e lojas de bebê).
 *
 * São aproximadas: servem de ponto de partida até haver preços informados por quem usa o app
 * (ver `referenciaDePreco`). Ficam de fora os preços de marcas importadas ou artesanais muito
 * acima do comum. Os valores seguem a unidade do item no catálogo (`precoPor`: por unidade,
 * par, pacote, frasco, caixa, kit ou conjunto).
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
  'capa-colchao': reais(30, 100),
  'saco-dormir': reais(40, 200),
  'comoda-trocador': reais(320, 750),
  mosquiteiro: reais(25, 100),
  'luz-noturna': reais(15, 60),
  'baba-eletronica': reais(170, 700),
  'berco-portatil': reais(370, 920),

  // Passeio e transporte
  'bebe-conforto': reais(250, 900),
  'base-bebe-conforto': reais(400, 1200),
  carrinho: reais(400, 2000),
  canguru: reais(60, 300),
  'bolsa-maternidade': reais(60, 300),
  'trocador-portatil': reais(28, 100),

  // Higiene e banho
  banheira: reais(30, 180),
  'suporte-banheira': reais(60, 250),
  'toalha-capuz': reais(27, 90),
  'sabonete-neutro': reais(15, 35),
  shampoo: reais(12, 30),
  algodao: reais(7, 15),
  'alcool-70': reais(8, 25),
  'tesoura-unha': reais(10, 45),
  'escova-cabelo': reais(15, 50),
  'lenco-umedecido': reais(8, 20),
  'pomada-assadura': reais(20, 45),
  'fralda-rn': reais(20, 40),
  'fralda-p': reais(35, 75),
  'fralda-pano': reais(4, 12),
  'lixeira-fralda': reais(35, 150),

  // Alimentação e amamentação
  'almofada-amamentacao': reais(50, 250),
  'sutia-amamentacao': reais(25, 150),
  'absorvente-seio': reais(20, 90),
  'bomba-leite': reais(45, 350),
  mamadeira: reais(20, 120),
  chupeta: reais(10, 60),
  esterilizador: reais(15, 250),
  babador: reais(6, 25),
  'cadeira-alimentacao': reais(150, 750),

  // Roupas
  'body-curto': reais(10, 40),
  'body-longo': reais(12, 45),
  mijao: reais(8, 30),
  macacao: reais(30, 110),
  meias: reais(4, 15),
  casaquinho: reais(30, 120),
  touca: reais(5, 30),
  luvas: reais(5, 20),
  manta: reais(20, 80),
  'saida-maternidade': reais(60, 250),
  sapatinho: reais(15, 70),

  // Saúde
  termometro: reais(17, 130),
  'soro-fisiologico': reais(5, 16),
  'aspirador-nasal': reais(15, 100),
  umidificador: reais(90, 250),

  // Mala da maternidade
  'absorvente-pos-parto': reais(13, 45),
  'camisola-abertura': reais(55, 100),
  'calcinha-pos-parto': reais(17, 65),
  'cinta-pos-parto': reais(40, 250),

  // Segurança da casa
  'protetor-tomada': reais(10, 30),
  'trava-gaveta': reais(18, 60),
  'portao-seguranca': reais(90, 350),
};
