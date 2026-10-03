-- Lista em tempo real: o app é avisado (Supabase Realtime) quando um item da lista muda ou
-- quando a dona muda as permissões, e sincroniza na hora.
--
-- O Realtime respeita o RLS: cada pessoa só recebe as mudanças das linhas que ela pode ler
-- (os itens da própria lista e as pessoas da lista).
alter publication supabase_realtime add table public.itens, public.membros_lista;
