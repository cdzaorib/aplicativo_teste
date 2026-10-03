import { formatarPreco, ordenarLista, resumirLista } from './lista';
import type { ItemLista } from './tipos';

function descrever(item: ItemLista): string {
  const nome = item.quantidade > 1 ? `${item.quantidade}x ${item.nome}` : item.nome;
  const comModelo = item.modelo ? `${nome} (${item.modelo})` : nome;
  return item.precoCentavos !== undefined
    ? `${comModelo}: ${formatarPreco(item.precoCentavos * item.quantidade)}`
    : comModelo;
}

/**
 * A lista em texto para mandar por WhatsApp ou outro app de mensagem, a quem não usa o app:
 * o que falta comprar (por prioridade), o que já foi comprado e os totais. O título vai em
 * negrito no WhatsApp.
 */
export function listaComoTexto(itens: ItemLista[], titulo = 'Lista do enxoval'): string {
  const ordenados = ordenarLista(itens, 'prioridade');
  const faltam = ordenados.filter((item) => !item.comprado);
  const comprados = ordenados.filter((item) => item.comprado);
  const resumo = resumirLista(itens);

  const blocos = [`*${titulo}*`];
  if (faltam.length) {
    blocos.push(
      [`Falta comprar (${faltam.length}):`, ...faltam.map((item) => `• ${descrever(item)}`)].join(
        '\n',
      ),
    );
  }
  if (comprados.length) {
    blocos.push(
      [
        `Já comprado (${comprados.length}):`,
        ...comprados.map((item) => `✓ ${descrever(item)}`),
      ].join('\n'),
    );
  }
  blocos.push(
    `Previsto: ${formatarPreco(resumo.previstoCentavos)} · Gasto: ${formatarPreco(resumo.gastoCentavos)}`,
  );
  return blocos.join('\n\n');
}
