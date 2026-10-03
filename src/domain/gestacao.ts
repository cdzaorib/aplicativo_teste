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

/** Aviso agendado no aparelho para o começo de uma fase de compras. */
export type LembreteFase = { quando: Quando; data: Date; titulo: string; corpo: string };

const TEXTOS_LEMBRETE: Record<Quando, { titulo: string; corpo: string }> = {
  tri2: {
    titulo: 'Começou o 2º trimestre',
    corpo:
      'É hora de comprar os itens maiores do enxoval. Veja na sua lista o que é hora de comprar.',
  },
  tri3: {
    titulo: 'Começou o 3º trimestre',
    corpo: 'Chegou a vez de mais itens do enxoval. Veja na sua lista o que é hora de comprar.',
  },
  maternidade: {
    titulo: 'Hora de preparar a mala da maternidade',
    corpo: 'Veja na sua lista os itens da mala e o que ainda falta comprar.',
  },
  depois: {
    titulo: 'A data prevista do parto chegou',
    corpo: 'Veja na sua lista os itens para depois do nascimento.',
  },
};

/** Hora do dia em que os avisos aparecem. */
const HORA_DO_LEMBRETE = 10;

/**
 * Avisos para o começo de cada fase de compras que ainda não chegou, às 10h do dia em que a fase
 * começa (pelo relógio do aparelho).
 */
export function lembretesDasFases(dataPrevista: string, agora = new Date()): LembreteFase[] {
  const [ano, mes, dia] = dataPrevista.split('-').map(Number);
  return (Object.keys(INICIO_COMPRA) as Quando[])
    .map((quando) => {
      // A gestação começa 280 dias antes da data prevista; a fase começa N semanas depois disso.
      const data = new Date(ano, mes - 1, dia - DIAS_GESTACAO + INICIO_COMPRA[quando] * 7);
      data.setHours(HORA_DO_LEMBRETE, 0, 0, 0);
      return { quando, data, ...TEXTOS_LEMBRETE[quando] };
    })
    .filter((lembrete) => lembrete.data.getTime() > agora.getTime());
}
