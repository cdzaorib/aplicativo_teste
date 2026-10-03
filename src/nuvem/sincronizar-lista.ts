import { mesclarListas, type Permissao, type RegistroNuvem } from '@/domain/sincronizacao';
import { useListaStore } from '@/store/lista';

/** Onde a lista é guardada na nuvem. Separado do Supabase para poder testar com um falso. */
export type RepositorioLista = {
  buscar: () => Promise<RegistroNuvem[]>;
  gravar: (registros: RegistroNuvem[]) => Promise<void>;
};

const TENTATIVAS = 3;

/**
 * Os itens do aparelho são de outra lista quando a pessoa passou a ser convidada numa lista
 * compartilhada (por exemplo, entrou por outro celular). Eles já foram juntados no servidor e não
 * devem ser reenviados. Voltando para a própria lista, os itens ficam como cópia.
 */
export function itensSaoDeOutraLista(
  listaIdLocal: string | undefined,
  lista: { id: string; souDona: boolean },
): boolean {
  return listaIdLocal !== undefined && listaIdLocal !== lista.id && !lista.souDona;
}

/**
 * Sincroniza a lista do aparelho com a nuvem, respeitando o que a pessoa pode alterar.
 * Retorna `false` se o usuário continuou alterando a lista durante todas as tentativas;
 * nesse caso a próxima sincronização termina o trabalho.
 */
export async function sincronizarLista(
  repositorio: RepositorioLista,
  permissao: Permissao = 'total',
  listaId?: string,
): Promise<boolean> {
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    const { itens, removidos, versaoLocal } = useListaStore.getState();
    const resultado = mesclarListas(itens, removidos, await repositorio.buscar(), permissao);
    if (resultado.enviar.length) await repositorio.gravar(resultado.enviar);

    // Se a lista mudou enquanto falávamos com a nuvem, aplicar o resultado apagaria a mudança.
    // Tentamos de novo com a versão atual (gravar os mesmos registros outra vez não causa problema).
    if (useListaStore.getState().versaoLocal === versaoLocal) {
      useListaStore.getState().aplicarSincronizacao(resultado.itens, listaId);
      return true;
    }
  }
  return false;
}
