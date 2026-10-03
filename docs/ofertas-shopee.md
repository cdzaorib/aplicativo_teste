# Ligar as ofertas da Shopee (Fase 2b)

A estrutura já está pronta e publicada. Falta só a credencial da Shopee.

- **Banco:** as tabelas `ofertas` e `historico_ofertas` estão criadas. Qualquer pessoa lê, mas só a
  coleta grava.
- **Edge Function `coletar-ofertas`:** está publicada.
  - Para cada um dos 62 itens do catálogo, busca os produtos na Shopee.
  - Descarta os preços implausíveis: muito abaixo da faixa comum (acessório ou golpe) ou acima do
    dobro do máximo (kit ou outro produto).
  - Guarda as 5 primeiras por relevância, apaga as antigas e registra o resumo do dia.
- **App:** a tela "Comparar preço" mostra as ofertas quando existem, com o selo "dentro da faixa",
  "abaixo" etc., e o menor preço dos últimos 30 dias. Enquanto a tabela estiver vazia, a seção não
  aparece.

Sem as credenciais, a função responde "Credenciais da Shopee não configuradas" e não faz nada.

## 1. Pegar as credenciais na Shopee

Quando o acesso à **Shopee Affiliate Open API** for aprovado, copie o **App ID** e o **Secret** no
painel de afiliados da Shopee.

> O Secret é uma senha: não coloque no código nem no repositório.

## 2. Guardar os segredos no Supabase

No painel do Supabase, projeto **enxoval** → **Edge Functions → Secrets**, adicione:

| Nome             | Valor                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| `SHOPEE_APP_ID`  | o App ID da Shopee                                                      |
| `SHOPEE_SEGREDO` | o Secret da Shopee                                                      |
| `CHAVE_COLETA`   | um texto aleatório longo, que só o agendamento usa para chamar a coleta |

Para gerar a `CHAVE_COLETA`, use um gerador de senhas com 40 caracteres ou mais.

## 3. Testar uma coleta

No terminal, troque `SUA_CHAVE_COLETA` pela chave do passo 2:

```bash
curl -X POST https://ggcocihztrpwfptnuqbc.supabase.co/functions/v1/coletar-ofertas \
  -H "x-chave-coleta: SUA_CHAVE_COLETA"
```

A resposta traz quantos itens e ofertas foram coletados e as falhas, por exemplo
`{"itens":62,"ofertas":280,"falhas":[]}`. Leva até um minuto.

- Para ver as ofertas: **Table Editor → ofertas**.
- Para ver os erros: **Edge Functions → coletar-ofertas → Logs**.
- O erro **"Invalid Signature"** (código 10020) quer dizer que o App ID ou o Secret estão errados.

## 4. Agendar uma coleta por dia

No **SQL Editor** do Supabase, troque `SUA_CHAVE_COLETA` e rode. A coleta fica todo dia às 6h
(horário de Brasília):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('SUA_CHAVE_COLETA', 'chave_coleta');

select cron.schedule(
  'coletar-ofertas',
  '0 9 * * *', -- 9h UTC = 6h em Brasília
  $$
  select net.http_post(
    url := 'https://ggcocihztrpwfptnuqbc.supabase.co/functions/v1/coletar-ofertas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_e_jIPqOLI98ByO6iKcKX6w_9yvDbnrA',
      'x-chave-coleta', (select decrypted_secret from vault.decrypted_secrets where name = 'chave_coleta')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
```

Para conferir as execuções: `select * from cron.job_run_details order by start_time desc limit 5;`.

## Ajustes comuns

- **Links de afiliado:** hoje a oferta leva ao link comum do produto, por decisão do produto.
  Para ganhar comissão, troque `produto.productLink` por `produto.offerLink` em
  `supabase/functions/coletar-ofertas/regras.ts` e publique a função de novo.
- **Mudou o catálogo ou as faixas de preço:** rode `npm run gerar:catalogo-coleta` e publique a
  função de novo. O teste `npm run test:supabase` avisa se você esquecer.
- **Quantidade de ofertas ou filtro de preço:** `OFERTAS_POR_ITEM` e `precoPlausivel` em
  `regras.ts`.
