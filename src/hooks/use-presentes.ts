import { useCallback, useEffect, useState } from 'react';

import { buscarPresentes, type PresentesDaLista } from '@/nuvem/presentes';
import { useSessaoStore } from '@/store/sessao';

/**
 * Lista de presentes da lista atual: o código do link e quem escolheu cada presente. Busca de
 * novo quando a lista muda ou um convidado escolhe algo (tempo real). Sem login, fica vazia.
 */
export function usePresentes(): PresentesDaLista & { carregado: boolean; recarregar: () => void } {
  const listaId = useSessaoStore((s) => (s.usuario ? s.lista?.id : undefined));
  const mudancas = useSessaoStore((s) => s.mudancasPresentes);
  const [buscados, setBuscados] = useState<{ listaId: string; dados: PresentesDaLista }>();
  const [pedidos, setPedidos] = useState(0);
  const recarregar = useCallback(() => setPedidos((n) => n + 1), []);

  useEffect(() => {
    if (!listaId) return;
    let ativo = true;
    buscarPresentes(listaId)
      .then((dados) => ativo && setBuscados({ listaId, dados }))
      // Sem internet, as telas seguem sem a lista de presentes.
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [listaId, mudancas, pedidos]);

  const atual = buscados && buscados.listaId === listaId ? buscados.dados : undefined;
  return { carregado: atual !== undefined, presentes: {}, ...atual, recarregar };
}
