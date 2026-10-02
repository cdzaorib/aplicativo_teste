import type { SupabaseClient } from '@supabase/supabase-js';

import { deLinha, paraLinha, type LinhaItem } from '@/nuvem/linhas';
import { sincronizarLista, type RepositorioLista } from '@/nuvem/sincronizar-lista';
import { supabase } from '@/nuvem/supabase';
import { useSessaoStore } from '@/store/sessao';

function repositorioSupabase(cliente: SupabaseClient, userId: string): RepositorioLista {
  return {
    buscar: async () => {
      const { data, error } = await cliente.from('itens_lista').select('*');
      if (error) throw error;
      return (data as LinhaItem[]).map(deLinha);
    },
    gravar: async (registros) => {
      const { error } = await cliente.from('itens_lista').upsert(
        registros.map((registro) => paraLinha(registro, userId)),
        { onConflict: 'user_id,id' },
      );
      if (error) throw error;
    },
  };
}

async function executar() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const usuario = data.session?.user;
  if (!usuario) return;

  useSessaoStore.setState({ sincronizando: true });
  try {
    await sincronizarLista(repositorioSupabase(supabase, usuario.id));
    useSessaoStore.setState({ ultimaSincronizacao: Date.now(), erroSincronizacao: undefined });
  } catch (erro) {
    useSessaoStore.setState({
      erroSincronizacao: 'Não foi possível sincronizar. Verifique sua conexão.',
    });
    throw erro;
  } finally {
    useSessaoStore.setState({ sincronizando: false });
  }
}

let emAndamento: Promise<void> | null = null;
let pedidaDeNovo = false;

/**
 * Sincroniza a lista do usuário conectado; sem usuário, não faz nada.
 * Pedidos feitos durante uma sincronização geram mais uma rodada ao final.
 */
export function sincronizar(): Promise<void> {
  if (emAndamento) {
    pedidaDeNovo = true;
    return emAndamento;
  }
  emAndamento = (async () => {
    try {
      do {
        pedidaDeNovo = false;
        await executar();
      } while (pedidaDeNovo);
    } finally {
      emAndamento = null;
    }
  })();
  return emAndamento;
}
