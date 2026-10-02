-- Preços que as pessoas encontraram nas lojas, informados pelo app ("achou um preço? digite aqui").
-- São anônimos para quem lê: ninguém consulta as linhas, só os agregados de `referencia_precos`.
-- O user_id existe para limitar a um preço por item, por pessoa, por dia, e para apagar os dados
-- junto com a conta.
create table public.precos_informados (
  id bigint generated always as identity primary key,
  catalogo_id text not null,
  preco_centavos integer not null check (preco_centavos between 1 and 10000000),
  loja text check (loja in ('mercadolivre', 'amazon', 'magalu', 'shopee', 'loja-fisica', 'outra')),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  criado_em timestamptz not null default now(),
  unique (user_id, catalogo_id, dia)
);

alter table public.precos_informados enable row level security;

create policy "Usuário informa preços em seu nome"
  on public.precos_informados for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Necessária para o upsert: informar de novo no mesmo dia substitui o preço anterior.
create policy "Usuário corrige o próprio preço"
  on public.precos_informados for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Faixa central (25% a 75%) dos preços dos últimos 180 dias, usando só o preço mais recente de
-- cada pessoa, para ninguém distorcer a referência sozinho. Itens com menos de 5 pessoas ficam
-- de fora, o que também impede identificar quem informou.
create function public.referencia_precos()
returns table (catalogo_id text, quantidade integer, p25_centavos integer, p75_centavos integer)
language sql
stable
security definer
set search_path = ''
as $$
  with ultimo_por_pessoa as (
    select distinct on (p.catalogo_id, p.user_id) p.catalogo_id, p.preco_centavos
    from public.precos_informados p
    where p.criado_em > now() - interval '180 days'
    order by p.catalogo_id, p.user_id, p.criado_em desc
  )
  select
    u.catalogo_id,
    count(*)::integer,
    round(percentile_cont(0.25) within group (order by u.preco_centavos))::integer,
    round(percentile_cont(0.75) within group (order by u.preco_centavos))::integer
  from ultimo_por_pessoa u
  group by u.catalogo_id
  having count(*) >= 5;
$$;

revoke execute on function public.referencia_precos() from public;
grant execute on function public.referencia_precos() to anon, authenticated;
