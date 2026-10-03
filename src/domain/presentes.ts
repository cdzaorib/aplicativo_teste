import type { Categoria } from './tipos';

/** Situação de um item na lista de presentes, como o convidado vê. */
export type SituacaoPresente = 'livre' | 'reservado' | 'comprado';

/** Item da lista de presentes, como aparece para os convidados. */
export type ItemPresente = {
  id: string;
  catalogoId?: string;
  nome: string;
  modelo: string;
  quantidade: number;
  categoria: Categoria;
  situacao: SituacaoPresente;
};

/** O que o link mostra: o primeiro nome de quem é dona da lista e os presentes. */
export type ListaPresentes = { nome?: string; itens: ItemPresente[] };

type LinhaPresente = {
  id: string;
  catalogo_id: string | null;
  nome: string;
  modelo: string;
  quantidade: number;
  categoria: string;
  situacao: SituacaoPresente;
};

/** Converte o que a função `ver_lista_presentes` devolve. `null` quer dizer link inválido. */
export function deListaPresentes(
  dados: { nome: string | null; itens: LinhaPresente[] } | null,
): ListaPresentes | null {
  if (!dados) return null;
  return {
    ...(dados.nome && { nome: dados.nome }),
    itens: dados.itens.map((linha) => ({
      id: linha.id,
      ...(linha.catalogo_id && { catalogoId: linha.catalogo_id }),
      nome: linha.nome,
      modelo: linha.modelo,
      quantidade: linha.quantidade,
      categoria: linha.categoria as Categoria,
      situacao: linha.situacao,
    })),
  };
}

const ORDEM_SITUACAO: Record<SituacaoPresente, number> = { livre: 0, reservado: 1, comprado: 2 };

/** Os presentes ainda livres primeiro; dentro de cada grupo, por nome. */
export function ordenarPresentes(itens: ItemPresente[]): ItemPresente[] {
  return [...itens].sort(
    (a, b) =>
      ORDEM_SITUACAO[a.situacao] - ORDEM_SITUACAO[b.situacao] ||
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
  );
}

/** Endereço que os convidados abrem. Sem o endereço da versão web, não há link para enviar. */
export function linkDosPresentes(
  enderecoWeb: string | undefined,
  codigo: string,
): string | undefined {
  return enderecoWeb ? `${enderecoWeb.replace(/\/+$/, '')}/presente/${codigo}` : undefined;
}

/** Mensagem para enviar o link aos convidados (WhatsApp, por exemplo). */
export function mensagemDosPresentes(link: string, nome?: string): string {
  const deQuem = nome ? ` de ${nome}` : '';
  return `Lista de presentes do chá de bebê${deQuem}: ${link}\n\nEscolha um presente e marque lá, para ninguém dar o mesmo.`;
}
