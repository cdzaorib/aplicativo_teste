import type { SupabaseClient } from '@supabase/supabase-js';

import { mudancaJaConhecida } from '@/domain/sincronizacao';
import { deLinha, type LinhaItem } from '@/nuvem/linhas';
import { useListaStore } from '@/store/lista';
import { useSessaoStore } from '@/store/sessao';

/** Numera os canais: o Supabase reaproveita um canal com o mesmo nome, mesmo enquanto o fecha. */
let canais = 0;

/**
 * Escuta, pelo Supabase Realtime, as mudanças feitas por outras pessoas ou por outro aparelho:
 * nos itens da lista atual e na própria participação (permissões, ser removido da lista).
 * Chama `aoMudar` quando é preciso sincronizar. Retorna a função que para de escutar.
 *
 * O Realtime respeita o RLS: só chegam mudanças de linhas que a pessoa pode ler.
 */
export function acompanharLista(
  cliente: SupabaseClient,
  listaId: string,
  usuarioId: string,
  aoMudar: () => void,
): () => void {
  canais += 1;
  const canal = cliente
    .channel(`lista-${listaId}-${canais}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'itens', filter: `lista_id=eq.${listaId}` },
      (mudanca) => {
        const linha = mudanca.new as Partial<LinhaItem>;
        // Sem a linha nova (por exemplo, numa exclusão), sincroniza para conferir.
        if (!linha.id || !linha.atualizado_em) return aoMudar();
        const { itens, removidos } = useListaStore.getState();
        if (!mudancaJaConhecida(deLinha(linha as LinhaItem), itens, removidos)) aoMudar();
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'membros_lista', filter: `user_id=eq.${usuarioId}` },
      () => aoMudar(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'membros_lista', filter: `lista_id=eq.${listaId}` },
      // Alguém entrou na lista ou mudou de permissão: a tela Conta recarrega as pessoas.
      () => useSessaoStore.setState((s) => ({ mudancasMembros: s.mudancasMembros + 1 })),
    )
    .subscribe();

  return () => {
    // Sem internet, o canal fecha sozinho quando a conexão cai; não há o que tratar.
    cliente.removeChannel(canal).catch(() => {});
  };
}
