// Coleta diária de ofertas da Shopee para os itens do catálogo (Fase 2b).
//
// Chamada pelo agendamento do banco (pg_cron + pg_net, ver docs/ofertas-shopee.md) com o
// cabeçalho `x-chave-coleta`. Para cada item, busca os produtos na Shopee, guarda as melhores
// ofertas em `ofertas`, apaga as que não vieram de novo e registra o resumo do dia em
// `historico_ofertas`.
//
// Segredos (Edge Functions → Secrets): SHOPEE_APP_ID, SHOPEE_SEGREDO e CHAVE_COLETA. Sem eles, a
// função não faz nada. Publicada com verify_jwt = false: quem chama é o agendamento, com a chave.
import { createClient } from 'npm:@supabase/supabase-js@2';

import catalogo from './catalogo.json' with { type: 'json' };
import {
  assinar,
  BUSCAS_SIMULTANEAS,
  cabecalhoAutorizacao,
  consultaOfertas,
  emParalelo,
  ENDERECO_API,
  paraOfertas,
  resumoDoDia,
  type ItemColeta,
  type ProdutoShopee,
} from './regras.ts';

function resposta(corpo: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Chave secreta nova (sb_secret_...) ou, se o projeto não tiver, a service_role antiga. */
function chaveSecreta(): string {
  const novas = Deno.env.get('SUPABASE_SECRET_KEYS');
  const nova: string | undefined = novas ? JSON.parse(novas).default : undefined;
  return nova ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

async function buscarNaShopee(
  appId: string,
  segredo: string,
  termo: string,
): Promise<ProdutoShopee[]> {
  const corpo = JSON.stringify(consultaOfertas(termo));
  const timestamp = Math.floor(Date.now() / 1000);
  const assinatura = await assinar(appId, timestamp, corpo, segredo);
  const respostaShopee = await fetch(ENDERECO_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: cabecalhoAutorizacao(appId, timestamp, assinatura),
    },
    body: corpo,
  });
  const dados = await respostaShopee.json();
  if (dados.errors?.length) throw new Error(dados.errors[0].message ?? 'erro da Shopee');
  return dados.data?.productOfferV2?.nodes ?? [];
}

Deno.serve(async (req) => {
  const chaveColeta = Deno.env.get('CHAVE_COLETA');
  if (!chaveColeta || req.headers.get('x-chave-coleta') !== chaveColeta) {
    return resposta({ erro: 'Não autorizado.' }, 401);
  }
  const appId = Deno.env.get('SHOPEE_APP_ID');
  const segredo = Deno.env.get('SHOPEE_SEGREDO');
  if (!appId || !segredo) {
    return resposta({ erro: 'Credenciais da Shopee não configuradas.' }, 503);
  }

  const banco = createClient(Deno.env.get('SUPABASE_URL')!, chaveSecreta(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const coletadoEm = new Date().toISOString();
  const dia = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const resultado = { itens: 0, ofertas: 0, falhas: [] as string[] };

  await emParalelo(catalogo as ItemColeta[], BUSCAS_SIMULTANEAS, async (item) => {
    try {
      const ofertas = paraOfertas(
        await buscarNaShopee(appId, segredo, item.busca),
        item,
        coletadoEm,
      );
      if (ofertas.length) {
        const { error } = await banco
          .from('ofertas')
          .upsert(ofertas, { onConflict: 'catalogo_id,loja,produto_id' });
        if (error) throw error;
        const resumo = resumoDoDia(ofertas, dia);
        const { error: erroHistorico } = await banco
          .from('historico_ofertas')
          .upsert(resumo!, { onConflict: 'catalogo_id,loja,dia' });
        if (erroHistorico) throw erroHistorico;
      }
      // Ofertas que não vieram nesta coleta saíram da Shopee ou deixaram de ser as melhores.
      const { error: erroLimpeza } = await banco
        .from('ofertas')
        .delete()
        .eq('catalogo_id', item.id)
        .eq('loja', 'shopee')
        .lt('coletado_em', coletadoEm);
      if (erroLimpeza) throw erroLimpeza;
      resultado.itens += 1;
      resultado.ofertas += ofertas.length;
    } catch (erro) {
      resultado.falhas.push(`${item.id}: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  });

  console.log('Coleta de ofertas', JSON.stringify(resultado));
  return resposta(resultado);
});
