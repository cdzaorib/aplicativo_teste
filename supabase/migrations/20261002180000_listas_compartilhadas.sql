-- Listas compartilhadas: cada pessoa participa de exatamente uma lista, como dona ou convidada.
-- A dona (normalmente a gestante) convida por código e decide, para cada convidado, se ele pode
-- editar a lista e/ou editar os preços. Sem permissão, o convidado só visualiza.
--
-- Os itens passam da tabela `itens_lista` (por usuário, sem uso a partir daqui) para `itens`
-- (por lista). `itens_lista` está vazia e pode ser apagada depois.

create schema if not exists privado;

create table public.listas (
  id uuid primary key default gen_random_uuid(),
  dona_id uuid not null unique references auth.users (id) on delete cascade,
  codigo_convite text not null unique,
  criada_em timestamptz not null default now()
);

create table public.membros_lista (
  lista_id uuid not null references public.listas (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text,
  e_dona boolean not null default false,
  pode_editar_lista boolean not null default false,
  pode_editar_precos boolean not null default false,
  entrou_em timestamptz not null default now(),
  primary key (lista_id, user_id)
);

create table public.itens (
  lista_id uuid not null references public.listas (id) on delete cascade,
  id text not null,
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
  primary key (lista_id, id)
);

-- Funções auxiliares das regras de acesso. Ficam num esquema que a API não publica.

create function privado.minha_lista() returns uuid
language sql stable security definer set search_path = ''
as $$ select m.lista_id from public.membros_lista m where m.user_id = auth.uid() $$;

create function privado.posso_editar_lista() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select m.e_dona or m.pode_editar_lista from public.membros_lista m where m.user_id = auth.uid()),
    false)
$$;

-- Quem pode editar a lista também pode editar os preços.
create function privado.posso_editar_precos() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select m.e_dona or m.pode_editar_lista or m.pode_editar_precos
       from public.membros_lista m where m.user_id = auth.uid()),
    false)
$$;

create function privado.nome_usuario(usuario uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', u.email)
  from auth.users u where u.id = usuario
$$;

-- Código de 8 caracteres sem letras/números ambíguos (0/O, 1/I), ex.: K7P2QX9M.
create function privado.novo_codigo() returns text
language plpgsql volatile set search_path = ''
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  codigo text;
begin
  loop
    bytes := extensions.gen_random_bytes(8);
    codigo := '';
    for i in 0..7 loop
      codigo := codigo || substr(alfabeto, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.listas l where l.codigo_convite = codigo);
  end loop;
  return codigo;
end
$$;

revoke all on function privado.nome_usuario(uuid), privado.novo_codigo() from public;
grant usage on schema privado to authenticated;
grant execute on function privado.minha_lista(), privado.posso_editar_lista(),
  privado.posso_editar_precos() to authenticated;

-- Regras de acesso

alter table public.listas enable row level security;
alter table public.membros_lista enable row level security;
alter table public.itens enable row level security;

create policy "Dona vê a própria lista"
  on public.listas for select to authenticated
  using ((select auth.uid()) = dona_id);

create policy "Membros veem quem está na lista"
  on public.membros_lista for select to authenticated
  using (lista_id = (select privado.minha_lista()));

create policy "Membros veem os itens da lista"
  on public.itens for select to authenticated
  using (lista_id = (select privado.minha_lista()));

create policy "Quem pode editar a lista adiciona itens"
  on public.itens for insert to authenticated
  with check (lista_id = (select privado.minha_lista()) and (select privado.posso_editar_lista()));

create policy "Quem pode editar a lista ou os preços altera itens"
  on public.itens for update to authenticated
  using (lista_id = (select privado.minha_lista()) and (select privado.posso_editar_precos()))
  with check (lista_id = (select privado.minha_lista()) and (select privado.posso_editar_precos()));

-- Quem só pode editar preços não pode mudar mais nada no item.
create function privado.conferir_edicao_item() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or privado.posso_editar_lista() then
    return new;
  end if;
  if (new.lista_id, new.id, new.catalogo_id, new.nome, new.categoria, new.prioridade, new.modelo,
      new.quantidade, new.comprado, new.removido, new.criado_em)
     is distinct from
     (old.lista_id, old.id, old.catalogo_id, old.nome, old.categoria, old.prioridade, old.modelo,
      old.quantidade, old.comprado, old.removido, old.criado_em) then
    raise exception 'Sem permissão para editar a lista: só o preço pode ser alterado'
      using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger conferir_edicao_item
  before update on public.itens
  for each row execute function privado.conferir_edicao_item();

