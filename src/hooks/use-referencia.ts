import { FAIXAS_PESQUISADAS } from '@/domain/faixas-preco';
import { referenciaDePreco } from '@/domain/precos';
import { useReferenciasStore } from '@/store/referencias';

/** Referência de preço de um item do catálogo: preços informados ou faixa pesquisada. */
export function useReferencia(catalogoId: string | undefined) {
  const informados = useReferenciasStore((s) =>
    catalogoId ? s.informados[catalogoId] : undefined,
  );
  if (!catalogoId) return undefined;
  return referenciaDePreco(FAIXAS_PESQUISADAS[catalogoId], informados);
}
