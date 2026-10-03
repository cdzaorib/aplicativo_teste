import { useEffect, useState } from 'react';

import { buscarMembros } from '@/nuvem/compartilhar';
import { useSessaoStore } from '@/store/sessao';

/**
 * Nomes de quem está na lista atual (id -> nome), para mostrar quem comprou cada item. Busca de
 * novo quando a lista muda ou alguém entra nela. Sem login, fica vazio.
 */
export function useNomesDaLista(): Record<string, string> {
  const listaId = useSessaoStore((s) => (s.usuario ? s.lista?.id : undefined));
  const mudancasMembros = useSessaoStore((s) => s.mudancasMembros);
  const [buscados, setBuscados] = useState<{ listaId: string; nomes: Record<string, string> }>();

  useEffect(() => {
    if (!listaId) return;
    let ativo = true;
    buscarMembros()
      .then((membros) => {
        if (!ativo) return;
        const nomes: Record<string, string> = {};
        for (const membro of membros) if (membro.nome) nomes[membro.userId] = membro.nome;
        setBuscados({ listaId, nomes });
      })
      // Sem os nomes, a lista só não mostra quem comprou.
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [listaId, mudancasMembros]);

  return buscados && buscados.listaId === listaId ? buscados.nomes : {};
}
