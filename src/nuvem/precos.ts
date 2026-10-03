import type { OrigemPreco } from '@/domain/precos';
import { deLinhasReferencia } from '@/nuvem/linhas';
import { supabase } from '@/nuvem/supabase';
import { useReferenciasStore } from '@/store/referencias';

/** As referências mudam devagar; não precisa buscar mais que uma vez por hora. */
const INTERVALO_MS = 60 * 60 * 1000;

/** Busca os preços informados (agregados) para avaliar preços. Funciona sem login. */
export async function atualizarReferencias(forcar = false): Promise<void> {
  if (!supabase) return;
  const { atualizadoEm } = useReferenciasStore.getState();
  if (!forcar && atualizadoEm && Date.now() - atualizadoEm < INTERVALO_MS) return;

  const { data, error } = await supabase.rpc('referencia_precos');
  if (error) throw error;
  useReferenciasStore.setState({
    informados: deLinhasReferencia(data ?? []),
    atualizadoEm: Date.now(),
  });
}

/**
 * Compartilha, de forma anônima, um preço encontrado numa loja. Exige login; informar o mesmo
 * item de novo no mesmo dia substitui o preço anterior.
 */
export async function informarPreco(
  catalogoId: string,
  precoCentavos: number,
  origem?: OrigemPreco,
): Promise<void> {
  if (!supabase) throw new Error('Compartilhamento de preços indisponível nesta versão.');
  const { error } = await supabase
    .from('precos_informados')
    .upsert(
      { catalogo_id: catalogoId, preco_centavos: precoCentavos, loja: origem ?? null },
      { onConflict: 'user_id,catalogo_id,dia' },
    );
  if (error) throw error;
}
