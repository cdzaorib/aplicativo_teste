import type { EstatisticaPrecos } from '@/domain/precos';
import type { RegistroNuvem } from '@/domain/sincronizacao';
import type { Categoria, Prioridade } from '@/domain/tipos';

/** Linha da tabela `itens_lista` (supabase/migrations). */
export type LinhaItem = {
  id: string;
  user_id: string;
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

export function paraLinha(registro: RegistroNuvem, userId: string): LinhaItem {
  return {
    id: registro.id,
    user_id: userId,
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
