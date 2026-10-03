-- Índice para a exclusão de conta achar rápido os itens comprados pela pessoa
-- (on delete set null em itens.comprado_por). Pedido pelo advisor de desempenho do Supabase.
create index itens_comprado_por_idx on public.itens (comprado_por);
