-- O upsert (informar de novo no mesmo dia) precisa ler a linha existente: sem permissão de
-- leitura o Postgres recusa o ON CONFLICT DO UPDATE. Cada pessoa lê só os próprios preços;
-- os das outras continuam visíveis apenas como agregado em `referencia_precos`.
create policy "Usuário lê os próprios preços"
  on public.precos_informados for select to authenticated
  using ((select auth.uid()) = user_id);
