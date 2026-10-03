import { deListaPresentes, type ListaPresentes } from '@/domain/presentes';
import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';

/** Erro com mensagem pronta para mostrar na tela. */
export class ErroPresentes extends Error {}

function cliente() {
  if (!supabase) throw new ErroPresentes('A lista de presentes não está disponível nesta versão.');
  return supabase;
}

/** As regras do banco já respondem em português (P0001); os demais erros viram `padrao`. */
function erro(e: { code?: string; message: string }, padrao: string): ErroPresentes {
  return new ErroPresentes(e.code === 'P0001' ? e.message : padrao);
}

/** Lista de presentes vista por quem está na lista: o código do link e quem escolheu o quê. */
export type PresentesDaLista = {
  codigo?: string;
  /** Itens incluídos na lista de presentes, com o nome de quem escolheu, se alguém escolheu. */
  presentes: Record<string, { reservadoPor?: string }>;
};

export async function buscarPresentes(listaId: string): Promise<PresentesDaLista> {
  const banco = cliente();
  const [link, presentes] = await Promise.all([
    banco.from('links_presentes').select('codigo').eq('lista_id', listaId).maybeSingle(),
    banco.from('presentes').select('item_id, reservado_por').eq('lista_id', listaId),
  ]);
  if (link.error) throw erro(link.error, 'Não foi possível carregar a lista de presentes.');
  if (presentes.error)
    throw erro(presentes.error, 'Não foi possível carregar a lista de presentes.');
  return {
    ...(link.data && { codigo: link.data.codigo }),
    presentes: Object.fromEntries(
      presentes.data.map((linha) => [
        linha.item_id,
        linha.reservado_por ? { reservadoPor: linha.reservado_por } : {},
      ]),
    ),
  };
}

/** Cria o link na primeira vez (ou devolve o que já existe). */
export async function criarLinkPresentes(): Promise<string> {
  const { data, error } = await cliente().rpc('criar_link_presentes');
  if (error) throw erro(error, 'Não foi possível criar o link. Tente de novo.');
  return data;
}

/** Troca o link: o antigo para de funcionar, e as escolhas feitas continuam. */
export async function trocarLinkPresentes(): Promise<string> {
  const { data, error } = await cliente().rpc('trocar_link_presentes');
  if (error) throw erro(error, 'Não foi possível trocar o link. Tente de novo.');
  return data;
}

/**
 * Coloca itens na lista de presentes. Antes, sincroniza: o item precisa estar na nuvem para
 * entrar na lista.
 */
export async function incluirPresentes(listaId: string, itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return;
  await sincronizar();
  const { error } = await cliente()
    .from('presentes')
    .upsert(
      itemIds.map((itemId) => ({ lista_id: listaId, item_id: itemId })),
      { onConflict: 'lista_id,item_id', ignoreDuplicates: true },
    );
  if (error) throw erro(error, 'Não foi possível incluir na lista de presentes.');
}

/** Tira um item da lista de presentes (e a escolha de quem tinha escolhido). */
export async function tirarPresente(listaId: string, itemId: string): Promise<void> {
  const { error } = await cliente()
    .from('presentes')
    .delete()
    .eq('lista_id', listaId)
    .eq('item_id', itemId);
  if (error) throw erro(error, 'Não foi possível tirar da lista de presentes.');
}

/** Libera um presente que um convidado escolheu. */
export async function liberarPresente(itemId: string): Promise<void> {
  const { error } = await cliente().rpc('liberar_presente', { item: itemId });
  if (error) throw erro(error, 'Não foi possível liberar o presente.');
}

// Para os convidados (sem login).

/** A lista de presentes do link, ou `null` se o link não vale. */
export async function verListaPresentes(codigo: string): Promise<ListaPresentes | null> {
  const { data, error } = await cliente().rpc('ver_lista_presentes', { codigo_link: codigo });
  if (error) throw erro(error, 'Não foi possível abrir a lista. Verifique sua internet.');
  return deListaPresentes(data as Parameters<typeof deListaPresentes>[0]);
}

/** Escolhe um presente. Devolve a chave que permite desfazer a escolha. */
export async function reservarPresente(
  codigo: string,
  itemId: string,
  nome: string,
): Promise<string> {
  const { data, error } = await cliente().rpc('reservar_presente', {
    codigo_link: codigo,
    item: itemId,
    nome_convidado: nome,
  });
  if (error) throw erro(error, 'Não foi possível marcar o presente. Tente de novo.');
  return data;
}

export async function desfazerReservaPresente(
  codigo: string,
  itemId: string,
  chave: string,
): Promise<void> {
  const { error } = await cliente().rpc('desfazer_reserva_presente', {
    codigo_link: codigo,
    item: itemId,
    chave,
  });
  if (error) throw erro(error, 'Não foi possível desfazer. Tente de novo.');
}
