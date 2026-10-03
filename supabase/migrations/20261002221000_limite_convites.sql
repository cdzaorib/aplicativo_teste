-- Limite de tentativas de código de convite: no máximo 10 por pessoa a cada hora, para ninguém
-- testar códigos até achar a lista de outra pessoa.
--
-- Um código errado agora devolve null em vez de erro. Um erro desfaria a transação inteira,
-- inclusive a tentativa contada, e o limite nunca seria atingido.

create table privado.tentativas_convite (
  user_id uuid primary key references auth.users (id) on delete cascade,
  inicio timestamptz not null default now(),
  tentativas integer not null default 0
);

alter table privado.tentativas_convite enable row level security;

-- Entra na lista do código, sem permissões (a dona decide depois). Quem estava na própria
-- lista tem os itens dela juntados à nova, sem repetir itens do catálogo. Quem já compartilha a
-- própria lista com outras pessoas não pode trocar. Devolve null se o código não existe.
create or replace function public.entrar_na_lista(codigo text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  feitas integer;
  nova uuid;
  atual uuid;
  era_dona boolean;
begin
  if usuario is null then
    raise exception 'É preciso entrar na conta' using errcode = '42501';
  end if;

  insert into privado.tentativas_convite as t (user_id, inicio, tentativas)
  values (usuario, now(), 1)
  on conflict (user_id) do update
  set inicio = case when t.inicio < now() - interval '1 hour' then now() else t.inicio end,
      tentativas = case when t.inicio < now() - interval '1 hour' then 1 else t.tentativas + 1 end
  returning t.tentativas into feitas;
  if feitas > 10 then
    raise exception 'Muitas tentativas. Tente de novo daqui a uma hora.' using errcode = 'P0001';
  end if;

  -- Só vale o código de uma lista cuja dona está nela (e não temporariamente em outra lista).
  select l.id into nova from public.listas l
  join public.membros_lista d on d.lista_id = l.id and d.user_id = l.dona_id
  where l.codigo_convite = upper(regexp_replace(codigo, '[^A-Za-z0-9]', '', 'g'));
  if nova is null then
    return null;
  end if;

  perform public.garantir_lista();
  select m.lista_id, m.e_dona into atual, era_dona
  from public.membros_lista m where m.user_id = usuario;
  if atual = nova then
    return nova;
  end if;
  if era_dona and exists (
    select 1 from public.membros_lista m where m.lista_id = atual and m.user_id <> usuario
  ) then
    raise exception 'Você já compartilha a sua lista com outras pessoas' using errcode = 'P0001';
  end if;

  if era_dona then
    insert into public.itens (lista_id, id, catalogo_id, nome, categoria, prioridade, modelo,
                              preco_centavos, quantidade, comprado, removido, criado_em, atualizado_em)
    select nova, i.id, i.catalogo_id, i.nome, i.categoria, i.prioridade, i.modelo,
           i.preco_centavos, i.quantidade, i.comprado, false, i.criado_em, now()
    from public.itens i
    where i.lista_id = atual and not i.removido
      and (i.catalogo_id is null or not exists (
        select 1 from public.itens j
        where j.lista_id = nova and j.catalogo_id = i.catalogo_id and not j.removido))
    on conflict (lista_id, id) do nothing;
  end if;

  update public.membros_lista m
  set lista_id = nova, e_dona = false, pode_editar_lista = false, pode_editar_precos = false,
      entrou_em = now()
  where m.user_id = usuario;
  return nova;
end
$$;
