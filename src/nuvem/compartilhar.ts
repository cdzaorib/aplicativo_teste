import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';
import { useListaStore } from '@/store/lista';

export type Membro = {
  userId: string;
  nome?: string;
  eDona: boolean;
  podeEditarLista: boolean;
  podeEditarPrecos: boolean;
};

type LinhaMembro = {
  user_id: string;
  nome: string | null;
  e_dona: boolean;
  pode_editar_lista: boolean;
  pode_editar_precos: boolean;
};

/** Erro com mensagem pronta para mostrar na tela. */
export class ErroCompartilhar extends Error {}

function cliente() {
  if (!supabase) throw new ErroCompartilhar('Compartilhamento indisponível nesta versão.');
  return supabase;
}

/** Erros de regra vêm do banco em português (P0001/P0002); os demais viram uma mensagem genérica. */
function traduzirErro(erro: { code?: string; message: string }, padrao: string): never {
  throw new ErroCompartilhar(
    erro.code === 'P0001' || erro.code === 'P0002' ? erro.message : padrao,
  );
}

export async function buscarMembros(): Promise<Membro[]> {
  const { data, error } = await cliente()
    .from('membros_lista')
    .select('user_id, nome, e_dona, pode_editar_lista, pode_editar_precos')
    .order('entrou_em');
  if (error) traduzirErro(error, 'Não foi possível carregar quem está na lista.');
  return (data as LinhaMembro[]).map((linha) => ({
    userId: linha.user_id,
    ...(linha.nome !== null && { nome: linha.nome }),
    eDona: linha.e_dona,
    podeEditarLista: linha.pode_editar_lista,
    podeEditarPrecos: linha.pode_editar_precos,
  }));
}

/**
 * Entra na lista de quem enviou o código. A lista deste aparelho é salva antes, juntada à
 * compartilhada no servidor e depois trocada pela compartilhada.
 */
export async function entrarNaLista(codigo: string): Promise<void> {
  const banco = cliente();
  await sincronizar();
  const { error } = await banco.rpc('entrar_na_lista', { codigo });
  if (error) traduzirErro(error, 'Não foi possível entrar na lista. Tente de novo.');
  useListaStore.getState().limpar();
  await sincronizar();
}

/** Sai da lista compartilhada e volta para a própria, com uma cópia do que está no aparelho. */
export async function sairDaLista(): Promise<void> {
  const banco = cliente();
  await sincronizar();
  const { error } = await banco.rpc('sair_da_lista');
  if (error) traduzirErro(error, 'Não foi possível sair da lista. Tente de novo.');
  await sincronizar();
}

export async function definirPermissoes(
  membro: string,
  editarLista: boolean,
  editarPrecos: boolean,
): Promise<void> {
  const { error } = await cliente().rpc('definir_permissoes', {
    membro,
    editar_lista: editarLista,
    editar_precos: editarPrecos,
  });
  if (error) traduzirErro(error, 'Não foi possível mudar a permissão.');
}

export async function removerMembro(membro: string): Promise<void> {
  const { error } = await cliente().rpc('remover_membro', { membro });
  if (error) traduzirErro(error, 'Não foi possível remover a pessoa.');
}

/** Gera um novo código de convite; o anterior deixa de funcionar. */
export async function trocarCodigoConvite(): Promise<void> {
  const { error } = await cliente().rpc('novo_codigo_convite');
  if (error) traduzirErro(error, 'Não foi possível gerar um novo código.');
  await sincronizar();
}

/** Mostra o código em dois blocos para facilitar a leitura: K7P2QX9M -> K7P2-QX9M. */
export function formatarCodigo(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}
