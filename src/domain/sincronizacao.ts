import type { ItemLista } from './tipos';

/** Item como guardado na nuvem: a remoção é lógica, para chegar aos outros aparelhos. */
export type RegistroNuvem = ItemLista & { removido: boolean };

export type ResultadoMescla = {
  /** Nova lista do aparelho. */
  itens: ItemLista[];
  /** Registros que precisam ser gravados na nuvem. */
  enviar: RegistroNuvem[];
};

/** O que a pessoa pode alterar numa lista compartilhada: tudo, só os preços, ou nada. */
export type Permissao = 'total' | 'precos' | 'leitura';

function semRemovido({ removido: _removido, ...item }: RegistroNuvem): ItemLista {
  return item;
}

const porCriacao = (a: ItemLista, b: ItemLista) => a.criadoEm - b.criadoEm;

/**
 * Junta a lista do aparelho com a da nuvem. Para cada item vence a versão alterada por último;
 * em caso de empate, vale a da nuvem. Sem permissão total, só vale o que a pessoa pode alterar.
 *
 * @param locais itens da lista do aparelho
 * @param removidos itens removidos no aparelho e ainda não enviados (id -> momento da remoção)
 * @param nuvem registros guardados na nuvem, inclusive os removidos
 * @param permissao o que a pessoa pode alterar na lista
 */
export function mesclarListas(
  locais: ItemLista[],
  removidos: Record<string, number>,
  nuvem: RegistroNuvem[],
  permissao: Permissao = 'total',
): ResultadoMescla {
  if (permissao !== 'total') return mesclarSemEditarLista(locais, nuvem, permissao);

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

  itens.sort(porCriacao);
  return { itens, enviar };
}

/**
 * Para quem não pode editar a lista, a nuvem manda: itens criados ou removidos no aparelho são
 * descartados. Com permissão de preços, vale só a mudança de preço feita no aparelho, se for a
 * alteração mais recente do item.
 */
function mesclarSemEditarLista(
  locais: ItemLista[],
  nuvem: RegistroNuvem[],
  permissao: Exclude<Permissao, 'total'>,
): ResultadoMescla {
  const doAparelho = new Map(locais.map((item) => [item.id, item]));
  const itens: ItemLista[] = [];
  const enviar: RegistroNuvem[] = [];

  for (const remoto of nuvem) {
    if (remoto.removido) continue;
    const local = doAparelho.get(remoto.id);
    const mudouPreco =
      permissao === 'precos' &&
      local !== undefined &&
      local.atualizadoEm > remoto.atualizadoEm &&
      local.precoCentavos !== remoto.precoCentavos;

    if (mudouPreco) {
      const atualizado = {
        ...remoto,
        precoCentavos: local.precoCentavos,
        atualizadoEm: local.atualizadoEm,
      };
      itens.push(semRemovido(atualizado));
      enviar.push(atualizado);
    } else {
      itens.push(semRemovido(remoto));
    }
  }

  itens.sort(porCriacao);
  return { itens, enviar };
}
