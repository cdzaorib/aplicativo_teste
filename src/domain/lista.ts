import { INICIO_COMPRA, quandoDoItem } from './gestacao';
import {
  CATEGORIAS,
  type FiltroLista,
  type ItemLista,
  type OrdemLista,
  type Prioridade,
} from './tipos';

const PESO_PRIORIDADE: Record<Prioridade, number> = {
  essencial: 0,
  util: 1,
  opcional: 2,
  evitar: 3,
};

const comparaTexto = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/** Valores ausentes (preço sem valor, modelo vazio) sempre vão para o fim. */
function comparaOpcional<T>(a: T | undefined, b: T | undefined, compara: (x: T, y: T) => number) {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return compara(a, b);
}

/** Semana em que começa a fase de compra do item; itens criados pela pessoa não têm. */
function inicioDaCompra(item: ItemLista): number | undefined {
  const quando = quandoDoItem(item);
  return quando && INICIO_COMPRA[quando];
}

const COMPARADORES: Record<OrdemLista, (a: ItemLista, b: ItemLista) => number> = {
  nome: () => 0,
  valor: (a, b) => comparaOpcional(a.precoCentavos, b.precoCentavos, (x, y) => x - y),
  modelo: (a, b) => comparaOpcional(a.modelo || undefined, b.modelo || undefined, comparaTexto),
  prioridade: (a, b) => PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade],
  categoria: (a, b) => comparaTexto(CATEGORIAS[a.categoria], CATEGORIAS[b.categoria]),
  quando: (a, b) => comparaOpcional(inicioDaCompra(a), inicioDaCompra(b), (x, y) => x - y),
};

/** Ordena a lista: itens pendentes primeiro, depois pelo critério escolhido e, no empate, pelo nome. */
export function ordenarLista(itens: ItemLista[], ordem: OrdemLista): ItemLista[] {
  return [...itens].sort(
    (a, b) =>
      Number(a.comprado) - Number(b.comprado) ||
      COMPARADORES[ordem](a, b) ||
      comparaTexto(a.nome, b.nome),
  );
}

/** Deixa só os itens que ainda faltam comprar, só os comprados, ou todos. */
export function filtrarLista(itens: ItemLista[], filtro: FiltroLista): ItemLista[] {
  if (filtro === 'todos') return itens;
  return itens.filter((item) => item.comprado === (filtro === 'comprados'));
}

export type ResumoLista = {
  total: number;
  comprados: number;
  previstoCentavos: number;
  gastoCentavos: number;
  semPreco: number;
};

export function resumirLista(itens: ItemLista[]): ResumoLista {
  return itens.reduce<ResumoLista>(
    (resumo, item) => {
      const valor = (item.precoCentavos ?? 0) * item.quantidade;
      return {
        total: resumo.total + 1,
        comprados: resumo.comprados + Number(item.comprado),
        previstoCentavos: resumo.previstoCentavos + valor,
        gastoCentavos: resumo.gastoCentavos + (item.comprado ? valor : 0),
        semPreco: resumo.semPreco + Number(item.precoCentavos === undefined),
      };
    },
    { total: 0, comprados: 0, previstoCentavos: 0, gastoCentavos: 0, semPreco: 0 },
  );
}

const formatoBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarPreco(centavos: number): string {
  return formatoBRL.format(centavos / 100);
}

/**
 * Converte o texto digitado em centavos. Aceita "1.234,56", "1234,56", "1234.56" e "R$ 10".
 * Retorna `undefined` para texto vazio ou inválido.
 */
export function lerPreco(texto: string): number | undefined {
  let limpo = texto.replace(/R\$|\s/g, '');
  if (!limpo) return undefined;

  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (!/^\d+\.\d{1,2}$/.test(limpo)) {
    // Sem vírgula, ponto só é decimal com 1 ou 2 casas (ex.: "10.5"); senão é milhar ("1.234").
    limpo = limpo.replace(/\./g, '');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return undefined;
  return Math.round(Number(limpo) * 100);
}

/** Texto para preencher o campo de preço a partir de centavos (ex.: 123456 -> "1234,56"). */
export function precoParaTexto(centavos: number | undefined): string {
  if (centavos === undefined) return '';
  return (centavos / 100).toFixed(2).replace('.', ',');
}

export function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
