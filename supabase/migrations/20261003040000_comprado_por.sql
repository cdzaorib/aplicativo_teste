-- Quem comprou cada item, para a lista compartilhada mostrar "Comprado por Paulo" e ninguém
-- comprar a mesma coisa duas vezes.
--
-- O banco preenche sozinho com quem marcou o item como comprado: o app não manda esse valor, e
-- quem usa a API não consegue trocá-lo. Desmarcar o item apaga o comprador. Se o comprador
-- excluir a conta, o campo fica vazio.
alter table public.itens
  add column comprado_por uuid references auth.users (id) on delete set null;

-- SECURITY DEFINER só para conferir em auth.users se o comprador ainda existe.
create function privado.registrar_comprador() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not new.comprado then
    new.comprado_por := null;
  elsif tg_op = 'INSERT' or not old.comprado then
    new.comprado_por := auth.uid();
  elsif new.comprado_por is null and old.comprado_por is not null
        and not exists (select 1 from auth.users u where u.id = old.comprado_por) then
    -- O comprador excluiu a conta (on delete set null): o campo fica vazio.
    null;
  else
    -- Já estava comprado: ninguém troca o comprador.
    new.comprado_por := old.comprado_por;
  end if;
  return new;
end
$$;

revoke all on function privado.registrar_comprador() from public;

create trigger registrar_comprador
  before insert or update on public.itens
  for each row execute function privado.registrar_comprador();
