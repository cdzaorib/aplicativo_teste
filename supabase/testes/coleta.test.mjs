// Testes das regras da coleta de ofertas da Shopee (supabase/functions/coletar-ofertas).
// Rode com `npm run test:supabase`.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { ARQUIVO_CATALOGO_COLETA, itensParaColeta } from '../../scripts/catalogo-coleta.mjs';
import {
  assinar,
  cabecalhoAutorizacao,
  consultaOfertas,
  emParalelo,
  OFERTAS_POR_ITEM,
  paraOfertas,
  precoPlausivel,
  reaisParaCentavos,
  resumoDoDia,
} from '../functions/coletar-ofertas/regras.ts';

const berco = {
  id: 'berco',
  busca: 'berço infantil',
  faixa: { minCentavos: 40000, maxCentavos: 250000 },
};
const COLETADO_EM = '2026-10-03T09:00:00.000Z';

function produto(itemId, priceMin, extra = {}) {
  return {
    itemId,
    productName: `Berço ${itemId}`,
    priceMin,
    priceMax: priceMin,
    productLink: `https://shopee.com.br/produto-${itemId}`,
    offerLink: `https://s.shopee.com.br/afiliado-${itemId}`,
    ...extra,
  };
}

describe('autorização da Shopee', () => {
  it('assina com SHA-256 de AppId + Timestamp + corpo + segredo', async () => {
    const corpo = JSON.stringify(consultaOfertas('berço infantil'));
    const esperado = createHash('sha256').update(`123${1700000000}${corpo}segredo`).digest('hex');
    assert.equal(await assinar('123', 1700000000, corpo, 'segredo'), esperado);
  });

  it('monta o cabeçalho no formato da documentação', () => {
    assert.equal(
      cabecalhoAutorizacao('123', 1700000000, 'abc'),
      'SHA256 Credential=123, Timestamp=1700000000, Signature=abc',
    );
  });

  it('protege o termo de busca dentro da consulta', () => {
    const { query } = consultaOfertas('berço "americano"');
    assert.match(query, /keyword: "berço \\"americano\\""/);
  });
});

describe('conversão das ofertas', () => {
  it('converte reais em centavos e ignora valores inválidos', () => {
    assert.equal(reaisParaCentavos('59.9'), 5990);
    assert.equal(reaisParaCentavos('1234.56'), 123456);
    assert.equal(reaisParaCentavos(''), undefined);
    assert.equal(reaisParaCentavos('0'), undefined);
    assert.equal(reaisParaCentavos(undefined), undefined);
  });

  it('descarta preços implausíveis: acessórios muito baratos e kits muito caros', () => {
    assert.equal(precoPlausivel(20000, berco.faixa), false); // abaixo de 60% do mínimo
    assert.equal(precoPlausivel(24000, berco.faixa), true);
    assert.equal(precoPlausivel(500000, berco.faixa), true); // até o dobro do máximo
    assert.equal(precoPlausivel(500001, berco.faixa), false);
  });

  it('guarda as melhores ofertas com o link comum do produto, sem afiliado', () => {
    const ofertas = paraOfertas(
      [
        produto(1, '899.90', { ratingStar: '4.86', sales: 120, imageUrl: 'https://img/1' }),
        produto(2, '15.00'), // capa ou peça avulsa: barato demais para ser berço
        produto(1, '899.90'), // repetido
        produto(3, '1200', { priceMax: '1500' }),
      ],
      berco,
      COLETADO_EM,
    );
    assert.deepEqual(
      ofertas.map((o) => o.produto_id),
      ['1', '3'],
    );
    assert.deepEqual(ofertas[0], {
      catalogo_id: 'berco',
      loja: 'shopee',
      produto_id: '1',
      nome: 'Berço 1',
      preco_min_centavos: 89990,
      preco_max_centavos: 89990,
      link: 'https://shopee.com.br/produto-1',
      imagem_url: 'https://img/1',
      avaliacao: 4.9,
      vendas: 120,
      coletado_em: COLETADO_EM,
    });
    assert.equal(ofertas[1].preco_max_centavos, 150000);
  });

  it(`guarda no máximo ${OFERTAS_POR_ITEM} ofertas por item`, () => {
    const produtos = Array.from({ length: 12 }, (_, i) => produto(i + 1, '500'));
    assert.equal(paraOfertas(produtos, berco, COLETADO_EM).length, OFERTAS_POR_ITEM);
  });

  it('resume o dia com o menor preço e a mediana', () => {
    const ofertas = paraOfertas(
      [produto(1, '900'), produto(2, '500'), produto(3, '700'), produto(4, '1000')],
      berco,
      COLETADO_EM,
    );
    assert.deepEqual(resumoDoDia(ofertas, '2026-10-03'), {
      catalogo_id: 'berco',
      loja: 'shopee',
      dia: '2026-10-03',
      menor_preco_centavos: 50000,
      mediana_centavos: 80000,
      quantidade: 4,
    });
    assert.equal(resumoDoDia([], '2026-10-03'), undefined);
  });
});

describe('catálogo da coleta', () => {
  it('está igual ao catálogo do app (rode npm run gerar:catalogo-coleta se mudou)', async () => {
    const gravado = JSON.parse(await readFile(ARQUIVO_CATALOGO_COLETA, 'utf8'));
    assert.deepEqual(gravado, itensParaColeta());
  });
});

describe('coleta em paralelo', () => {
  it('processa todos os itens sem passar do limite de buscas ao mesmo tempo', async () => {
    let emAndamento = 0;
    let maximo = 0;
    const feitos = [];
    await emParalelo([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, async (n) => {
      emAndamento += 1;
      maximo = Math.max(maximo, emAndamento);
      await new Promise((resolver) => setTimeout(resolver, 5));
      feitos.push(n);
      emAndamento -= 1;
    });
    assert.equal(maximo, 4);
    assert.deepEqual(
      feitos.sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
  });

  it('funciona com menos itens que o limite e com nenhum', async () => {
    const feitos = [];
    await emParalelo(['a'], 4, async (x) => feitos.push(x));
    await emParalelo([], 4, async (x) => feitos.push(x));
    assert.deepEqual(feitos, ['a']);
  });
});
