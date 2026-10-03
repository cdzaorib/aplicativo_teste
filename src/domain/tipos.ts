export type Prioridade = 'essencial' | 'util' | 'opcional' | 'evitar';

export type Categoria =
  | 'quarto'
  | 'passeio'
  | 'higiene'
  | 'alimentacao'
  | 'roupas'
  | 'saude'
  | 'maternidade'
  | 'seguranca';

/** Como o preço de um item é contado: "R$ 20 por par", "R$ 15 por pacote". */
export type UnidadePreco = 'unidade' | 'par' | 'pacote' | 'frasco' | 'caixa' | 'kit' | 'conjunto';

/** Momento recomendado para comprar. */
export type Quando = 'tri2' | 'tri3' | 'maternidade' | 'depois';

export type ItemCatalogo = {
  id: string;
  nome: string;
  categoria: Categoria;
  prioridade: Prioridade;
  quando: Quando;
  /** Quantidade sugerida. */
  quantidade: number;
  porque: string;
  /** Fonte oficial que embasa a recomendação. Obrigatória para itens "evitar". */
  fonte?: string;
  /** Produto com certificação compulsória do Inmetro (lista a confirmar na revisão). */
  inmetro?: boolean;
  /** Termo usado para buscar o produto nas lojas (Fase 2). */
  busca: string;
  /** Como o preço é contado nas lojas e nas faixas; sem valor, por unidade. */
  precoPor?: UnidadePreco;
};

export type ItemLista = {
  id: string;
  /** Item do catálogo que originou este, se houver. */
  catalogoId?: string;
  nome: string;
  categoria: Categoria;
  prioridade: Prioridade;
  modelo: string;
  /** Preço unitário em centavos, para evitar erro de arredondamento. */
  precoCentavos?: number;
  quantidade: number;
  comprado: boolean;
  criadoEm: number;
  /** Momento da última alteração; decide qual versão vence na sincronização. */
  atualizadoEm: number;
};

export type OrdemLista = 'nome' | 'valor' | 'modelo' | 'prioridade' | 'categoria' | 'quando';

export const CATEGORIAS: Record<Categoria, string> = {
  quarto: 'Quarto e sono',
  passeio: 'Passeio e transporte',
  higiene: 'Higiene e banho',
  alimentacao: 'Alimentação e amamentação',
  roupas: 'Roupas',
  saude: 'Saúde',
  maternidade: 'Mala da maternidade',
  seguranca: 'Segurança da casa',
};

export const PRIORIDADES: Record<Prioridade, string> = {
  essencial: 'Essencial',
  util: 'Útil',
  opcional: 'Opcional',
  evitar: 'Evitar',
};

export const QUANDO: Record<Quando, string> = {
  tri2: '2º trimestre',
  tri3: '3º trimestre',
  maternidade: 'Antes da maternidade',
  depois: 'Depois do nascimento',
};

export const ORDENS: Record<OrdemLista, string> = {
  prioridade: 'Prioridade',
  nome: 'Nome',
  valor: 'Valor',
  modelo: 'Modelo',
  categoria: 'Categoria',
  quando: 'Quando comprar',
};
