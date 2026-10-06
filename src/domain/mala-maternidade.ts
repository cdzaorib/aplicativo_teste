/**
 * Mala da maternidade: o que levar para o parto. Cada maternidade tem a sua lista, então o app
 * sugere uma base com a fonte e manda conferir com a maternidade. Pesquisado em out/2026.
 */

export type ItemMala = { id: string; nome: string };

export type SecaoMala = { titulo: string; fonte: string; itens: ItemMala[] };

export const SECOES_MALA: SecaoMala[] = [
  {
    titulo: 'Documentos',
    fonte: 'Caderneta da Gestante (Ministério da Saúde) e NHS',
    itens: [
      { id: 'doc-identidade', nome: 'Documento de identidade com foto' },
      { id: 'doc-caderneta', nome: 'Caderneta da Gestante' },
      { id: 'doc-cartao-saude', nome: 'Cartão do SUS ou do plano de saúde' },
      { id: 'doc-exames', nome: 'Exames e ultrassons do pré-natal' },
      { id: 'doc-plano-parto', nome: 'Plano de parto, se você fez um' },
    ],
  },
  {
    titulo: 'Para você',
    fonte: 'NHS (sistema de saúde do Reino Unido)',
    itens: [
      { id: 'mae-roupa-parto', nome: 'Roupa larga e confortável para o trabalho de parto' },
      { id: 'mae-roupao', nome: 'Roupão e chinelo' },
      { id: 'mae-camisola', nome: 'Camisolas ou pijamas com abertura na frente' },
      { id: 'mae-trocas', nome: '3 trocas de roupa confortável, inclusive a de voltar para casa' },
      { id: 'mae-meias', nome: 'Meias' },
      { id: 'mae-calcinhas', nome: '5 ou 6 calcinhas' },
      { id: 'mae-sutias', nome: '2 ou 3 sutiãs de amamentação' },
      { id: 'mae-absorvente-seios', nome: 'Absorventes para os seios' },
      { id: 'mae-absorvente-pos-parto', nome: '2 pacotes de absorvente pós-parto' },
      {
        id: 'mae-higiene',
        nome: 'Escova e pasta de dente, escova de cabelo, sabonete, desodorante e protetor labial',
      },
      { id: 'mae-toalha', nome: 'Toalha' },
      { id: 'mae-lanches', nome: 'Lanches e garrafa de água' },
      { id: 'mae-celular', nome: 'Celular e carregador' },
    ],
  },
  {
    titulo: 'Para o bebê',
    fonte: 'NHS e Resolução Contran nº 819/2021 (bebê conforto)',
    itens: [
      { id: 'bebe-bodies', nome: 'Bodies e macacões para os dias na maternidade' },
      { id: 'bebe-saida', nome: 'Roupa para a saída da maternidade' },
      { id: 'bebe-touca', nome: 'Touca' },
      { id: 'bebe-luvas', nome: 'Luvas' },
      { id: 'bebe-meias', nome: 'Meias ou sapatinhos' },
      { id: 'bebe-agasalho', nome: 'Agasalho, se estiver frio' },
      { id: 'bebe-fraldas', nome: 'Fraldas tamanho RN' },
      { id: 'bebe-algodao', nome: 'Algodão ou lenços umedecidos' },
      { id: 'bebe-paninhos', nome: 'Paninhos de boca' },
      { id: 'bebe-manta', nome: 'Manta ou cueiro' },
      { id: 'bebe-conforto', nome: 'Bebê conforto instalado no carro, se for voltar de carro' },
    ],
  },
  {
    titulo: 'Para o acompanhante',
    fonte: 'NHS',
    itens: [
      { id: 'acomp-documento', nome: 'Documento de identidade com foto' },
      { id: 'acomp-roupa', nome: 'Troca de roupa' },
      { id: 'acomp-higiene', nome: 'Escova e pasta de dente e desodorante' },
      { id: 'acomp-celular', nome: 'Celular e carregador' },
      { id: 'acomp-lanches', nome: 'Lanches e bebidas' },
      { id: 'acomp-remedios', nome: 'Remédios que usa, se usar algum' },
      { id: 'acomp-dinheiro', nome: 'Dinheiro ou cartão para estacionamento e lanchonete' },
    ],
  },
];

export const TOTAL_ITENS_MALA = SECOES_MALA.reduce((total, secao) => total + secao.itens.length, 0);

const IDS_MALA = new Set(SECOES_MALA.flatMap((secao) => secao.itens.map((item) => item.id)));

/** Quantos itens da mala estão prontos (ignora ids que não existem mais na lista). */
export function itensProntos(marcados: string[]): number {
  return marcados.filter((id) => IDS_MALA.has(id)).length;
}

/** O NHS recomenda deixar a mala pronta pelo menos 3 semanas antes da data prevista. */
export const SEMANAS_ANTES_DA_DATA = 3;

/** Data (AAAA-MM-DD) até quando deixar a mala pronta: 3 semanas antes da data prevista. */
export function prazoDaMala(dataPrevista: string): string {
  const [ano, mes, dia] = dataPrevista.split('-').map(Number);
  const prazo = new Date(Date.UTC(ano, mes - 1, dia - SEMANAS_ANTES_DA_DATA * 7));
  return prazo.toISOString().slice(0, 10);
}

/** Direito ao acompanhante, com a lei de cada parte. */
export const DIREITO_ACOMPANHANTE =
  'No SUS, você tem direito a um acompanhante de sua escolha no trabalho de parto, no parto e no pós-parto imediato (Lei 11.108/2005). Desde 2023, a lei também garante acompanhante em consultas, exames e procedimentos, em serviços públicos e particulares (Lei 14.737/2023).';
