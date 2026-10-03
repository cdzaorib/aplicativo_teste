-- Reforço de segurança (defesa em profundidade). O RLS já protege as linhas; aqui, além dele,
-- o banco recusa de cara o que nenhuma tela do app faz:
--
-- * Sem login (papel `anon`), nenhuma tabela da lista: o convidado do chá de bebê usa só as
--   funções com o código secreto, e as ofertas continuam abertas para leitura.
-- * Com login, `listas` e `membros_lista` mudam só pelas funções (garantir_lista,
--   entrar_na_lista, definir_permissoes…), e itens e preços nunca são apagados pela API.
-- * Ninguém usa TRUNCATE, REFERENCES nem TRIGGER pela API. O TRUNCATE ignora o RLS.
-- * As funções do esquema `privado` que o RLS usa deixam de valer para qualquer papel
--   (PUBLIC); só quem tem login continua chamando.

revoke all on table
  public.listas,
  public.membros_lista,
  public.itens,
  public.itens_lista,
  public.precos_informados,
  public.presentes,
  public.links_presentes
from anon;

revoke insert, update, delete on table public.listas, public.membros_lista from authenticated;
revoke delete on table public.itens, public.itens_lista, public.precos_informados from authenticated;

revoke truncate, references, trigger on table
  public.listas,
  public.membros_lista,
  public.itens,
  public.itens_lista,
  public.precos_informados,
  public.presentes,
  public.links_presentes,
  public.ofertas,
  public.historico_ofertas
from anon, authenticated;

revoke all on function
  privado.minha_lista(),
  privado.posso_editar_lista(),
  privado.posso_editar_precos(),
  privado.conferir_edicao_item()
from public, anon;
grant execute on function
  privado.minha_lista(),
  privado.posso_editar_lista(),
  privado.posso_editar_precos(),
  privado.conferir_edicao_item()
to authenticated;
