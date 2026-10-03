import type { SupabaseClient } from '@supabase/supabase-js';

import type { Permissao } from '@/domain/sincronizacao';
import { deLinha, deLinhaInfoLista, paraLinha, type LinhaInfoLista } from '@/nuvem/linhas';
import {
  itensSaoDeOutraLista,
  sincronizarLista,
  type RepositorioLista,
} from '@/nuvem/sincronizar-lista';
import { supabase } from '@/nuvem/supabase';
import { useListaStore } from '@/store/lista';
import { permissaoNaLista, useSessaoStore, type InfoLista } from '@/store/sessao';

function repositorioSupabase(
  cliente: SupabaseClient,
  listaId: string,
  permissao: Permissao,
): RepositorioLista {
  return {
    buscar: async () => {
      const { data, error } = await cliente.from('itens').select('*').eq('lista_id', listaId);
      if (error) throw error;
      return data.map(deLinha);
    },
    gravar: async (registros) => {
      if (permissao === 'total') {
        const { error } = await cliente.from('itens').upsert(
          registros.map((registro) => paraLinha(registro, listaId)),
          { onConflict: 'lista_id,id' },
        );
        if (error) throw error;
        return;
      }
      // Quem só edita preços não pode criar itens: atualiza apenas o preço dos que existem.
      const respostas = await Promise.all(
        registros.map((registro) =>
          cliente
            .from('itens')
            .update({
              preco_centavos: registro.precoCentavos ?? null,
              atualizado_em: new Date(registro.atualizadoEm).toISOString(),
            })
            .eq('lista_id', listaId)
            .eq('id', registro.id),
        ),
      );
      const erro = respostas.find((resposta) => resposta.error)?.error;
      if (erro) throw erro;
    },
  };
}

/** Busca (e cria, na primeira vez) a lista atual da pessoa e guarda na sessão. */
async function atualizarInfoLista(cliente: SupabaseClient): Promise<InfoLista> {
  const { data, error } = await cliente.rpc('garantir_lista').single();
  if (error) throw error;
  const lista = deLinhaInfoLista(data as LinhaInfoLista);
  useSessaoStore.setState({ lista });
  return lista;
}

async function executar() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return;

  useSessaoStore.setState({ sincronizando: true });
  try {
    const lista = await atualizarInfoLista(supabase);
    if (itensSaoDeOutraLista(useListaStore.getState().listaId, lista)) {
      useListaStore.getState().limpar();
    }
    const permissao = permissaoNaLista(lista);
    await sincronizarLista(repositorioSupabase(supabase, lista.id, permissao), permissao, lista.id);
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
