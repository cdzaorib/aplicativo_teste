import { deLinhaOferta, type LinhaOferta, type Oferta } from '@/nuvem/linhas';
import { supabase } from '@/nuvem/supabase';

/** Ofertas mais antigas que isso ficaram para trás (a coleta roda uma vez por dia). */
const VALIDADE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Ofertas recentes de um item do catálogo, da mais barata para a mais cara. Funciona sem login.
 * Enquanto a coleta da Shopee não estiver ligada, devolve uma lista vazia.
 */
export async function buscarOfertas(catalogoId: string, agora = Date.now()): Promise<Oferta[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ofertas')
    .select(
      'produto_id, nome, preco_min_centavos, preco_max_centavos, link, imagem_url, avaliacao, vendas, coletado_em',
    )
    .eq('catalogo_id', catalogoId)
    .gte('coletado_em', new Date(agora - VALIDADE_MS).toISOString())
    .order('preco_min_centavos')
    .limit(5);
  if (error) throw error;
  return (data as LinhaOferta[]).map(deLinhaOferta);
}
