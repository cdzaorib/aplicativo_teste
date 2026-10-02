-- Itens da lista de enxoval de cada usuário.
-- Os ids são gerados no aparelho; a exclusão é lógica (`removido`) para que a remoção
-- feita em um aparelho chegue aos outros na sincronização.
create table public.itens_lista (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  catalogo_id text,
  nome text not null,
  categoria text not null,
  prioridade text not null check (prioridade in ('essencial', 'util', 'opcional', 'evitar')),
  modelo text not null default '',
  preco_centavos integer check (preco_centavos >= 0),
  quantidade integer not null default 1 check (quantidade > 0),
  comprado boolean not null default false,
  removido boolean not null default false,
  criado_em timestamptz not null,
  atualizado_em timestamptz not null,
  primary key (user_id, id)
);

alter table public.itens_lista enable row level security;

create policy "Usuário lê os próprios itens"
  on public.itens_lista for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuário cria os próprios itens"
  on public.itens_lista for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Usuário altera os próprios itens"
  on public.itens_lista for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
