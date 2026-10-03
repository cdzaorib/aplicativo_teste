// Gera a lista de itens que a coleta de ofertas busca (supabase/functions/coletar-ofertas/
// catalogo.json) a partir do catálogo do app, que é a única fonte. Rode depois de mudar o
// catálogo ou as faixas de preço: `npm run gerar:catalogo-coleta`. Um teste avisa se esquecer.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { CATALOGO } from '../src/domain/catalogo.ts';
import { FAIXAS_PESQUISADAS } from '../src/domain/faixas-preco.ts';

export const ARQUIVO_CATALOGO_COLETA = new URL(
  '../supabase/functions/coletar-ofertas/catalogo.json',
  import.meta.url,
);

/** Itens que podem ser comprados, com o termo de busca e a faixa de preço comum. */
export function itensParaColeta() {
  return CATALOGO.filter((item) => item.prioridade !== 'evitar' && FAIXAS_PESQUISADAS[item.id]).map(
    (item) => ({ id: item.id, busca: item.busca, faixa: FAIXAS_PESQUISADAS[item.id] }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const itens = itensParaColeta();
  await writeFile(ARQUIVO_CATALOGO_COLETA, `${JSON.stringify(itens, null, 2)}\n`);
  console.log(`catalogo.json gerado com ${itens.length} itens.`);
}
