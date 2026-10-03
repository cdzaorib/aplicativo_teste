-- Lista de presentes do chá de bebê.
--
-- Quem edita a lista escolhe quais itens entram (`presentes`) e cria um link secreto
-- (`links_presentes`). Os convidados abrem o link sem login e marcam "vou dar este" com o nome.
-- Eles veem só se o presente já foi escolhido; quem está na lista vê quem escolheu.
--
-- Os convidados só usam as funções `ver_lista_presentes`, `reservar_presente` e
-- `desfazer_reserva_presente`, que exigem o código do link. Ao reservar, o convidado recebe uma
-- chave que guarda no aparelho para poder desfazer; o banco guarda só o hash dela.

create table public.links_presentes (
  lista_id uuid primary key references public.listas (id) on delete cascade,
  codigo text not null unique,
  criado_em timestamptz not null default now()
);

create table public.presentes (
  lista_id uuid not null,
  item_id text not null,
  incluido_em timestamptz not null default now(),
  reservado_por text check (reservado_por is null or char_length(reservado_por) between 1 and 60),
  reservado_em timestamptz,
  chave_reserva_hash text,
  primary key (lista_id, item_id),
  foreign key (lista_id, item_id) references public.itens (lista_id, id) on delete cascade
);

alter table public.links_presentes enable row level security;
alter table public.presentes enable row level security;

create policy "Membros veem o link de presentes"
  on public.links_presentes for select to authenticated
  using (lista_id = (select privado.minha_lista()));

create policy "Membros veem os presentes e quem escolheu"
  on public.presentes for select to authenticated
  using (lista_id = (select privado.minha_lista()));

-- Incluir e tirar itens da lista de presentes. Reservar só pelas funções abaixo.
create policy "Quem edita a lista inclui presentes"
  on public.presentes for insert to authenticated
  with check (
    lista_id = (select privado.minha_lista()) and (select privado.posso_editar_lista())
    and reservado_por is null and reservado_em is null and chave_reserva_hash is null
  );

create policy "Quem edita a lista tira presentes"
  on public.presentes for delete to authenticated
  using (lista_id = (select privado.minha_lista()) and (select privado.posso_editar_lista()));

-- Ninguém escreve no link direto pela API: só pelas funções.
revoke insert, update, delete, truncate on public.links_presentes from anon, authenticated;
revoke update, truncate on public.presentes from anon, authenticated;

-- O código do link chega como o convidado digitou ou colou: sem espaços nem hífen, em maiúsculas.
create function privado.normalizar_codigo(codigo text) returns text
language sql immutable set search_path = ''
as $$ select upper(regexp_replace(coalesce(codigo, ''), '[^A-Za-z0-9]', '', 'g')) $$;

-- Código de 16 caracteres sem letras/números ambíguos: difícil de adivinhar.
create function privado.novo_codigo_presentes() returns text
language plpgsql volatile set search_path = ''
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  novo text;
begin
  loop
    bytes := extensions.gen_random_bytes(16);
    novo := '';
    for i in 0..15 loop
      novo := novo || substr(alfabeto, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.links_presentes l where l.codigo = novo);
  end loop;
  return novo;
end
$$;

create function privado.hash_chave(chave uuid) returns text
language sql immutable set search_path = ''
as $$ select encode(extensions.digest(chave::text, 'sha256'), 'hex') $$;

-- Lista do link, se o código existir. O parâmetro tem outro nome porque, numa função SQL, a
-- coluna `codigo` ganharia dele e qualquer código acharia uma lista.
create function privado.lista_do_link(codigo_link text) returns uuid
language sql stable security definer set search_path = ''
as $$
  select l.lista_id from public.links_presentes l
  where l.codigo = privado.normalizar_codigo(codigo_link)
$$;

-- Garante que a pessoa pode montar a lista de presentes e devolve a lista dela.
create function privado.lista_para_presentes() returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  lista uuid := privado.minha_lista();
begin
  if auth.uid() is null or lista is null or not privado.posso_editar_lista() then
    raise exception 'Só quem pode editar a lista monta a lista de presentes'
      using errcode = '42501';
  end if;
  return lista;
end
$$;

revoke all on function privado.normalizar_codigo(text), privado.novo_codigo_presentes(),
  privado.hash_chave(uuid), privado.lista_do_link(text), privado.lista_para_presentes()
  from public;

-- Cria o link da lista de presentes na primeira vez e devolve o código.
create function public.criar_link_presentes() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  lista uuid := privado.lista_para_presentes();
  atual text;
begin
  select l.codigo into atual from public.links_presentes l where l.lista_id = lista;
  if atual is null then
    atual := privado.novo_codigo_presentes();
    insert into public.links_presentes (lista_id, codigo) values (lista, atual);
  end if;
  return atual;
end
$$;

-- Troca o código: o link antigo para de funcionar. As escolhas dos convidados continuam.
create function public.trocar_link_presentes() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  lista uuid := privado.lista_para_presentes();
  novo text := privado.novo_codigo_presentes();
begin
  insert into public.links_presentes (lista_id, codigo) values (lista, novo)
  on conflict (lista_id) do update set codigo = excluded.codigo, criado_em = now();
  return novo;
end
$$;

-- Libera um presente escolhido por um convidado (por engano, desistência ou brincadeira).
create function public.liberar_presente(item text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.presentes p
  set reservado_por = null, reservado_em = null, chave_reserva_hash = null
  where p.lista_id = privado.lista_para_presentes() and p.item_id = item;
end
$$;

-- Para os convidados: o que está na lista do link. Devolve null se o link não existir.
-- Só o primeiro nome de quem é dono da lista, nunca o e-mail, e nunca o nome de quem escolheu.
create function public.ver_lista_presentes(codigo_link text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'nome', nullif(split_part(btrim(coalesce(
      u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ' ', 1), ''),
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'catalogo_id', i.catalogo_id,
        'nome', i.nome,
        'modelo', i.modelo,
        'quantidade', i.quantidade,
        'categoria', i.categoria,
        'situacao', case
          when i.comprado then 'comprado'
          when p.reservado_por is not null then 'reservado'
          else 'livre'
        end
      ) order by i.nome)
      from public.presentes p
      join public.itens i on i.lista_id = p.lista_id and i.id = p.item_id
      where p.lista_id = l.id and not i.removido
    ), '[]'::jsonb)
  )
  from public.listas l
  join auth.users u on u.id = l.dona_id
  where l.id = privado.lista_do_link(codigo_link)
$$;

-- Para os convidados: escolhe um presente. Devolve a chave para desfazer depois.
create function public.reservar_presente(codigo_link text, item text, nome_convidado text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  lista uuid := privado.lista_do_link(codigo_link);
  nome_limpo text := btrim(coalesce(nome_convidado, ''));
  chave uuid := gen_random_uuid();
begin
  if lista is null then
    raise exception 'Este link de presentes não vale mais. Peça o link novo a quem enviou.'
      using errcode = 'P0001';
  end if;
  if char_length(nome_limpo) not between 1 and 60 then
    raise exception 'Escreva seu nome, com até 60 letras.' using errcode = 'P0001';
  end if;
  update public.presentes p
  set reservado_por = nome_limpo, reservado_em = now(), chave_reserva_hash = privado.hash_chave(chave)
  from public.itens i
  where p.lista_id = lista and p.item_id = item and p.reservado_por is null
    and i.lista_id = p.lista_id and i.id = p.item_id and not i.removido and not i.comprado;
  if not found then
    raise exception 'Este presente já foi escolhido. Escolha outro da lista.' using errcode = 'P0001';
  end if;
  return chave;
end
$$;

-- Para os convidados: desfaz a própria escolha, com a chave recebida ao reservar.
create function public.desfazer_reserva_presente(codigo_link text, item text, chave uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.presentes p
  set reservado_por = null, reservado_em = null, chave_reserva_hash = null
  where p.lista_id = privado.lista_do_link(codigo_link) and p.item_id = item
    and p.chave_reserva_hash = privado.hash_chave(chave);
  if not found then
    raise exception 'Não deu para desfazer: a escolha já tinha sido liberada ou é de outra pessoa.'
      using errcode = 'P0001';
  end if;
end
$$;

revoke all on function public.criar_link_presentes(), public.trocar_link_presentes(),
  public.liberar_presente(text) from public, anon;
grant execute on function public.criar_link_presentes(), public.trocar_link_presentes(),
  public.liberar_presente(text) to authenticated;

revoke all on function public.ver_lista_presentes(text), public.reservar_presente(text, text, text),
  public.desfazer_reserva_presente(text, text, uuid) from public;
grant execute on function public.ver_lista_presentes(text), public.reservar_presente(text, text, text),
  public.desfazer_reserva_presente(text, text, uuid) to anon, authenticated;

-- Quem está na lista vê na hora quando um convidado escolhe um presente.
alter publication supabase_realtime add table public.presentes;
