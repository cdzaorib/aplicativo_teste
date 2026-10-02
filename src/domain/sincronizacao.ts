import type { ItemLista } from './tipos';

/** Item como guardado na nuvem: a remoção é lógica, para chegar aos outros aparelhos. */
export type RegistroNuvem = ItemLista & { removido: boolean };

export type ResultadoMescla = {
  /** Nova lista do aparelho. */
  itens: ItemLista[];
  /** Registros que precisam ser gravados na nuvem. */
  enviar: RegistroNuvem[];
};

function semRemovido({ removido: _removido, ...item }: RegistroNuvem): ItemLista {
  return item;
}

/**
 * Junta a lista do aparelho com a da nuvem. Para cada item vence a versão alterada por último;
 * em caso de empate, vale a da nuvem.
 *
 * @param locais itens da lista do aparelho
 * @param removidos itens removidos no aparelho e ainda não enviados (id -> momento da remoção)
 * @param nuvem registros guardados na nuvem, inclusive os removidos
 */
export function mesclarListas(
  locais: ItemLista[],
  removidos: Record<string, number>,
  nuvem: RegistroNuvem[],
): ResultadoMescla {
  const daNuvem = new Map(nuvem.map((registro) => [registro.id, registro]));
  const itens: ItemLista[] = [];
  const enviar: RegistroNuvem[] = [];

  for (const local of locais) {
    const remoto = daNuvem.get(local.id);
    daNuvem.delete(local.id);

    if (!remoto || local.atualizadoEm > remoto.atualizadoEm) {
      itens.push(local);
      enviar.push({ ...local, removido: false });
    } else if (!remoto.removido) {
      itens.push(semRemovido(remoto));
    }
  }

  for (const [id, removidoEm] of Object.entries(removidos)) {
    const remoto = daNuvem.get(id);
    // Remoção de item que nunca chegou à nuvem, ou que já foi removido lá: nada a enviar.
    if (!remoto || remoto.removido) continue;
    if (removidoEm >= remoto.atualizadoEm) {
      daNuvem.delete(id);
      enviar.push({ ...remoto, removido: true, atualizadoEm: removidoEm });
    }
    // Se o item foi alterado em outro aparelho depois da remoção, a alteração vence e ele volta.
  }

  for (const remoto of daNuvem.values()) {
    if (!remoto.removido) itens.push(semRemovido(remoto));
  }

  itens.sort((a, b) => a.criadoEm - b.criadoEm);
  return { itens, enviar };
}
