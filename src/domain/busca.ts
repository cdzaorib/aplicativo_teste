import type { ItemCatalogo } from './tipos';

/** Minúsculas e sem acentos, para "Berço" achar "berco" e vice-versa. */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Se o item do catálogo combina com o que a pessoa digitou: todas as palavras precisam aparecer
 * no nome ou no termo de busca do item, em qualquer ordem. Busca vazia combina com tudo.
 */
export function combinaComBusca(item: ItemCatalogo, busca: string): boolean {
  const palavras = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return true;
  const texto = normalizarTexto(`${item.nome} ${item.busca}`);
  return palavras.every((palavra) => texto.includes(palavra));
}
