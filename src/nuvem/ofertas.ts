import {
  deLinhaHistorico,
  deLinhaOferta,
  type DiaHistorico,
  type LinhaHistorico,
  type LinhaOferta,
  type Oferta,
} from '@/nuvem/linhas';
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

/** Quantos dias de histórico mostrar. */
export const DIAS_HISTORICO = 30;

/** Resumo diário das ofertas do item nos últimos dias, do mais antigo para o mais recente. */
export async function buscarHistorico(
  catalogoId: string,
  agora = Date.now(),
): Promise<DiaHistorico[]> {
  if (!supabase) return [];
  const desde = new Date(agora - DIAS_HISTORICO * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('historico_ofertas')
    .select('dia, menor_preco_centavos, mediana_centavos')
    .eq('catalogo_id', catalogoId)
    .gte('dia', desde)
    .order('dia');
  if (error) throw error;
  return (data as LinhaHistorico[]).map(deLinhaHistorico);
}
