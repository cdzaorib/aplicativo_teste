import { mesclarListas, type RegistroNuvem } from '@/domain/sincronizacao';
import { useListaStore } from '@/store/lista';

/** Onde a lista é guardada na nuvem. Separado do Supabase para poder testar com um falso. */
export type RepositorioLista = {
  buscar: () => Promise<RegistroNuvem[]>;
  gravar: (registros: RegistroNuvem[]) => Promise<void>;
};

const TENTATIVAS = 3;

/**
 * Sincroniza a lista do aparelho com a nuvem.
 * Retorna `false` se o usuário continuou alterando a lista durante todas as tentativas;
 * nesse caso a próxima sincronização termina o trabalho.
 */
export async function sincronizarLista(repositorio: RepositorioLista): Promise<boolean> {
  for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
    const { itens, removidos, versaoLocal } = useListaStore.getState();
    const resultado = mesclarListas(itens, removidos, await repositorio.buscar());
    if (resultado.enviar.length) await repositorio.gravar(resultado.enviar);

    // Se a lista mudou enquanto falávamos com a nuvem, aplicar o resultado apagaria a mudança.
    // Tentamos de novo com a versão atual (gravar os mesmos registros outra vez não causa problema).
    if (useListaStore.getState().versaoLocal === versaoLocal) {
      useListaStore.getState().aplicarSincronizacao(resultado.itens);
      return true;
    }
  }
  return false;
}
