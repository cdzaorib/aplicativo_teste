-- Exclusão de conta (exigida pela Apple e pelo Google para apps com login).
--
-- A Edge Function `excluir-conta` apaga o usuário em auth.users. Tudo o que é dele cai em
-- cascata: a lista própria e os itens dela, a participação em listas compartilhadas e os preços
-- informados. Este gatilho cuida de quem foi convidado: quando a lista de uma dona some, os
-- convidados voltam para as próprias listas, como se tivessem sido removidos por ela.

create function privado.devolver_convidados() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.membros_lista m
  set lista_id = propria.id, e_dona = true, pode_editar_lista = false,
      pode_editar_precos = false, entrou_em = now()
  from public.listas propria
  where m.lista_id = old.id and not m.e_dona and propria.dona_id = m.user_id;
  return old;
end
$$;

revoke all on function privado.devolver_convidados() from public;

create trigger devolver_convidados
before delete on public.listas
for each row execute function privado.devolver_convidados();

-- Cria a lista própria na primeira vez e devolve a lista atual da pessoa e suas permissões.
-- Agora também funciona se a lista própria já existe sem a participação, e se duas
-- sincronizações chegam juntas na primeira vez.
create or replace function public.garantir_lista()
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
    values (usuario, privado.novo_codigo())
    on conflict (dona_id) do nothing;
    select l.id into propria from public.listas l where l.dona_id = usuario;
    insert into public.membros_lista (lista_id, user_id, nome, e_dona)
    values (propria, usuario, privado.nome_usuario(usuario), true)
    on conflict (user_id) do nothing;
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
