-- Operações chamadas pelo app (RPC). Todas exigem login.
--
-- Cada pessoa tem sempre a própria lista (criada na primeira sincronização). Entrar numa lista
-- compartilhada só muda para qual lista a pessoa aponta em `membros_lista`; sair, ou ser
-- removida pela dona, a leva de volta para a própria lista. Nada é apagado.

-- Cria a lista própria na primeira vez e devolve a lista atual da pessoa e suas permissões.
create function public.garantir_lista()
returns table (
  lista_id uuid, e_dona boolean, pode_editar_lista boolean, pode_editar_precos boolean,
  codigo_convite text, nome_dona text
)
language plpgsql security definer set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  propria uuid;
begin
  if usuario is null then
    raise exception 'É preciso entrar na conta' using errcode = '42501';
  end if;
  if not exists (select 1 from public.membros_lista m where m.user_id = usuario) then
    insert into public.listas (dona_id, codigo_convite)
    values (usuario, privado.novo_codigo()) returning id into propria;
    insert into public.membros_lista (lista_id, user_id, nome, e_dona)
    values (propria, usuario, privado.nome_usuario(usuario), true);
  end if;
  return query
    select m.lista_id, m.e_dona,
           m.e_dona or m.pode_editar_lista,
           m.e_dona or m.pode_editar_lista or m.pode_editar_precos,
           case when m.e_dona then l.codigo_convite end,
           d.nome
    from public.membros_lista m
    join public.listas l on l.id = m.lista_id
    left join public.membros_lista d on d.lista_id = m.lista_id and d.e_dona
    where m.user_id = usuario;
end
$$;

-- Entra na lista do código, sem permissões (a dona decide depois). Quem estava na própria
-- lista tem os itens dela juntados à nova, sem repetir itens do catálogo. Quem já compartilha a
-- própria lista com outras pessoas não pode trocar.
create function public.entrar_na_lista(codigo text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  nova uuid;
  atual uuid;
  era_dona boolean;
begin
  if usuario is null then
    raise exception 'É preciso entrar na conta' using errcode = '42501';
  end if;
  -- Só vale o código de uma lista cuja dona está nela (e não temporariamente em outra lista).
  select l.id into nova from public.listas l
  join public.membros_lista d on d.lista_id = l.id and d.user_id = l.dona_id
  where l.codigo_convite = upper(regexp_replace(codigo, '[^A-Za-z0-9]', '', 'g'));
  if nova is null then
    raise exception 'Código de convite inválido' using errcode = 'P0002';
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

-- Leva um convidado de volta para a própria lista.
create function privado.voltar_para_propria_lista(usuario uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.membros_lista m
  set lista_id = (select l.id from public.listas l where l.dona_id = usuario),
      e_dona = true, pode_editar_lista = false, pode_editar_precos = false, entrou_em = now()
  where m.user_id = usuario and not m.e_dona;
  return found;
end
$$;

revoke all on function privado.voltar_para_propria_lista(uuid) from public;

-- Convidado sai da lista compartilhada e volta para a própria lista.
create function public.sair_da_lista() returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not privado.voltar_para_propria_lista(auth.uid()) then
    raise exception 'A dona da lista não pode sair dela' using errcode = 'P0001';
  end if;
end
$$;

-- Só a dona: muda as permissões de um convidado.
create function public.definir_permissoes(membro uuid, editar_lista boolean, editar_precos boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.membros_lista m
  set pode_editar_lista = editar_lista, pode_editar_precos = editar_precos
  where m.user_id = membro and not m.e_dona
    and m.lista_id = (select l.id from public.listas l where l.dona_id = auth.uid());
  if not found then
    raise exception 'Só a dona da lista pode mudar permissões' using errcode = '42501';
  end if;
end
$$;

-- Só a dona: tira um convidado da lista (ele volta para a própria lista).
create function public.remover_membro(membro uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.membros_lista m
    where m.user_id = membro and not m.e_dona
      and m.lista_id = (select l.id from public.listas l where l.dona_id = auth.uid())
  ) then
    raise exception 'Só a dona da lista pode remover pessoas' using errcode = '42501';
  end if;
  perform privado.voltar_para_propria_lista(membro);
end
$$;

-- Só a dona: troca o código (o anterior deixa de funcionar).
create function public.novo_codigo_convite() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  codigo text := privado.novo_codigo();
begin
  update public.listas l set codigo_convite = codigo where l.dona_id = auth.uid();
  if not found then
    raise exception 'Só a dona da lista pode trocar o código' using errcode = '42501';
  end if;
  return codigo;
end
$$;

revoke all on function public.garantir_lista(), public.entrar_na_lista(text),
  public.sair_da_lista(), public.definir_permissoes(uuid, boolean, boolean),
  public.remover_membro(uuid), public.novo_codigo_convite() from public, anon;
grant execute on function public.garantir_lista(), public.entrar_na_lista(text),
  public.sair_da_lista(), public.definir_permissoes(uuid, boolean, boolean),
  public.remover_membro(uuid), public.novo_codigo_convite() to authenticated;
