import type { EstatisticaPrecos } from '@/domain/precos';
import type { RegistroNuvem } from '@/domain/sincronizacao';
import type { Categoria, Prioridade } from '@/domain/tipos';
import type { InfoLista } from '@/store/sessao';

/** Linha da tabela `itens` (supabase/migrations). */
export type LinhaItem = {
  lista_id: string;
  id: string;
  catalogo_id: string | null;
  nome: string;
  categoria: string;
  prioridade: string;
  modelo: string;
  preco_centavos: number | null;
  quantidade: number;
  comprado: boolean;
  removido: boolean;
  criado_em: string;
  atualizado_em: string;
};

export function paraLinha(registro: RegistroNuvem, listaId: string): LinhaItem {
  return {
    lista_id: listaId,
    id: registro.id,
    catalogo_id: registro.catalogoId ?? null,
    nome: registro.nome,
    categoria: registro.categoria,
    prioridade: registro.prioridade,
    modelo: registro.modelo,
    preco_centavos: registro.precoCentavos ?? null,
    quantidade: registro.quantidade,
    comprado: registro.comprado,
    removido: registro.removido,
    criado_em: new Date(registro.criadoEm).toISOString(),
    atualizado_em: new Date(registro.atualizadoEm).toISOString(),
  };
}

export function deLinha(linha: LinhaItem): RegistroNuvem {
  return {
    id: linha.id,
    ...(linha.catalogo_id !== null && { catalogoId: linha.catalogo_id }),
    nome: linha.nome,
    categoria: linha.categoria as Categoria,
    prioridade: linha.prioridade as Prioridade,
    modelo: linha.modelo,
    ...(linha.preco_centavos !== null && { precoCentavos: linha.preco_centavos }),
    quantidade: linha.quantidade,
    comprado: linha.comprado,
    removido: linha.removido,
    criadoEm: Date.parse(linha.criado_em),
    atualizadoEm: Date.parse(linha.atualizado_em),
  };
}

/** Linha devolvida pela função `referencia_precos` (supabase/migrations). */
export type LinhaReferencia = {
  catalogo_id: string;
  quantidade: number;
  p25_centavos: number;
  p75_centavos: number;
};

export function deLinhasReferencia(linhas: LinhaReferencia[]): Record<string, EstatisticaPrecos> {
  return Object.fromEntries(
    linhas.map((linha) => [
      linha.catalogo_id,
      {
        quantidade: linha.quantidade,
        p25Centavos: linha.p25_centavos,
        p75Centavos: linha.p75_centavos,
      },
    ]),
  );
}

/** Linha devolvida pela função `garantir_lista` (supabase/migrations). */
export type LinhaInfoLista = {
  lista_id: string;
  e_dona: boolean;
  pode_editar_lista: boolean;
  pode_editar_precos: boolean;
  codigo_convite: string | null;
  nome_dona: string | null;
};

export function deLinhaInfoLista(linha: LinhaInfoLista): InfoLista {
  return {
    id: linha.lista_id,
    souDona: linha.e_dona,
    podeEditarLista: linha.pode_editar_lista,
    podeEditarPrecos: linha.pode_editar_precos,
    ...(linha.codigo_convite !== null && { codigoConvite: linha.codigo_convite }),
    ...(linha.nome_dona !== null && { nomeDona: linha.nome_dona }),
  };
}
