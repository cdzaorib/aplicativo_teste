-- Ofertas com preço dentro do app (Fase 2b).
--
-- A Edge Function `coletar-ofertas` busca na Shopee (Affiliate Open API) os produtos de cada item
-- do catálogo, uma vez por dia, e guarda as melhores ofertas. Ela grava com a chave secreta, que
-- ignora o RLS; quem usa o app só lê. Enquanto a Shopee não aprovar o acesso, as tabelas ficam
-- vazias e o app não mostra nada.

create table public.ofertas (
  catalogo_id text not null,
  loja text not null check (loja in ('shopee')),
  produto_id text not null,
  nome text not null,
  preco_min_centavos integer not null check (preco_min_centavos > 0),
  preco_max_centavos integer not null check (preco_max_centavos >= preco_min_centavos),
  -- Link do produto na loja. Sem link de afiliado por enquanto (decisão do produto).
  link text not null,
  imagem_url text,
  avaliacao numeric(2, 1) check (avaliacao between 0 and 5),
  vendas integer check (vendas >= 0),
  coletado_em timestamptz not null default now(),
  primary key (catalogo_id, loja, produto_id)
);

-- Resumo diário das ofertas de cada item, para mostrar o histórico de preço.
create table public.historico_ofertas (
  catalogo_id text not null,
  loja text not null check (loja in ('shopee')),
  dia date not null,
  menor_preco_centavos integer not null check (menor_preco_centavos > 0),
  mediana_centavos integer not null check (mediana_centavos >= menor_preco_centavos),
  quantidade integer not null check (quantidade > 0),
  primary key (catalogo_id, loja, dia)
);

alter table public.ofertas enable row level security;
alter table public.historico_ofertas enable row level security;

create policy "Qualquer pessoa vê as ofertas"
  on public.ofertas for select to anon, authenticated
  using (true);

create policy "Qualquer pessoa vê o histórico de ofertas"
  on public.historico_ofertas for select to anon, authenticated
  using (true);

-- Além de não haver política de escrita, tira a permissão: só a coleta grava.
revoke insert, update, delete, truncate on public.ofertas, public.historico_ofertas
  from anon, authenticated;
