import { CATALOGO } from './catalogo';
import type { ItemLista, Quando } from './tipos';

/**
 * "Quando comprar" a partir da data prevista do parto. A data é dado de saúde (LGPD), então fica
 * só no aparelho e todas as contas são feitas aqui.
 */

/** A gestação é contada em 40 semanas (280 dias) até a data prevista do parto. */
const DIAS_GESTACAO = 280;
const MS_POR_DIA = 86_400_000;

/** Semana de gestação a partir da qual é hora de comprar os itens de cada fase. */
export const INICIO_COMPRA: Record<Quando, number> = {
  tri2: 14,
  tri3: 28,
  // A mala da maternidade costuma ficar pronta no fim do 3º trimestre.
  maternidade: 32,
  // Sem saber o dia do nascimento, vale a data prevista.
  depois: 40,
};

const QUANDO_DO_CATALOGO = new Map(CATALOGO.map((item) => [item.id, item.quando]));

/** Fase de compra de um item da lista; itens criados pela pessoa não têm. */
export function quandoDoItem(item: ItemLista): Quando | undefined {
  return item.catalogoId ? QUANDO_DO_CATALOGO.get(item.catalogoId) : undefined;
}

/** Dia (contado desde 1970) de uma data AAAA-MM-DD, sem depender de fuso horário. */
function diaDaData(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia) / MS_POR_DIA;
}

function diaDeHoje(agora: Date): number {
  return Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()) / MS_POR_DIA;
}

/** Semanas completas de gestação na data de hoje. */
export function semanasDeGestacao(dataPrevista: string, agora = new Date()): number {
  const diasGestacao = DIAS_GESTACAO - (diaDaData(dataPrevista) - diaDeHoje(agora));
  return Math.max(0, Math.floor(diasGestacao / 7));
}

/** Texto curto da fase atual, por exemplo "2º trimestre". */
export function faseDaGestacao(semanas: number): string {
  if (semanas < 14) return '1º trimestre';
  if (semanas < 28) return '2º trimestre';
  if (semanas < 40) return '3º trimestre';
  return 'Data prevista alcançada';
}

/** Se já chegou a fase de comprar um item (os sem fase nunca entram). */
export function eHoraDeComprar(quando: Quando | undefined, semanas: number): boolean {
  return quando !== undefined && semanas >= INICIO_COMPRA[quando];
}

/** Itens ainda não comprados cuja fase de compra já chegou. */
export function itensParaComprarAgora(itens: ItemLista[], semanas: number): ItemLista[] {
  return itens.filter((item) => !item.comprado && eHoraDeComprar(quandoDoItem(item), semanas));
}

/** Coloca as barras enquanto a pessoa digita: "15012027" -> "15/01/2027". */
export function mascararData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)].filter(Boolean).join('/');
}

/** "AAAA-MM-DD" -> "DD/MM/AAAA". */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

export type LeituraData = { data: string } | { erro: string };

/**
 * Lê a data prevista do parto digitada como DD/MM/AAAA e confere se faz sentido: até cerca de
 * 10 meses à frente e no máximo um ano atrás (o bebê já nasceu).
 */
export function lerDataPrevista(texto: string, agora = new Date()): LeituraData {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return { erro: 'Digite a data no formato DD/MM/AAAA.' };
  const [, dia, mes, ano] = partes;
  const data = `${ano}-${mes}-${dia}`;
  const conferida = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  if (conferida.getUTCDate() !== Number(dia) || conferida.getUTCMonth() !== Number(mes) - 1) {
    return { erro: 'Essa data não existe.' };
  }
  const diasAteAData = diaDaData(data) - diaDeHoje(agora);
  if (diasAteAData > DIAS_GESTACAO + 14) {
    return { erro: 'A data prevista do parto fica no máximo 10 meses à frente.' };
  }
  if (diasAteAData < -365) return { erro: 'Essa data já passou há mais de um ano.' };
  return { data };
}
