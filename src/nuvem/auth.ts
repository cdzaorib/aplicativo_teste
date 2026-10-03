import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';
import { useGestacaoStore } from '@/store/gestacao';
import { useListaStore } from '@/store/lista';

/** Rota que recebe a volta do login (src/app/auth-callback.tsx). */
const ROTA_RETORNO = 'auth-callback';

/**
 * Abre o login do Google no navegador e cria a sessão no Supabase.
 * Retorna `false` se a pessoa fechou a janela sem entrar.
 */
export async function entrarComGoogle(): Promise<boolean> {
  if (!supabase) throw new Error('Login indisponível nesta versão do app.');

  const redirectTo = Linking.createURL(ROTA_RETORNO);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (resultado.type !== 'success') return false;

  const parametros = new URL(resultado.url).searchParams;
  const erro = parametros.get('error_description') ?? parametros.get('error');
  if (erro) throw new Error(erro);

  const codigo = parametros.get('code');
  if (!codigo) throw new Error('O Google não devolveu um código de acesso.');

  await concluirLogin(codigo);
  return true;
}

const trocas = new Map<string, Promise<void>>();

/**
 * Troca o código da volta do login pela sessão. No Android a volta chega tanto aqui quanto à rota
 * `auth-callback`, que também chama esta função (inclusive quando o sistema fechou o app enquanto
 * a pessoa estava no navegador). Cada código só pode ser trocado uma vez, então as duas chamadas
 * compartilham a mesma troca.
 */
export function concluirLogin(codigo: string): Promise<void> {
  let troca = trocas.get(codigo);
  if (!troca) {
    troca = (async () => {
      if (!supabase) throw new Error('Login indisponível nesta versão do app.');
      const { error } = await supabase.auth.exchangeCodeForSession(codigo);
      if (error) throw error;
    })();
    trocas.set(codigo, troca);
  }
  return troca;
}

/**
 * Exclui a conta na nuvem (supabase/functions/excluir-conta): a lista, a participação em listas
 * compartilhadas e os preços informados. Depois encerra a sessão e apaga deste aparelho a lista
 * e a data prevista do parto.
 */
export async function excluirConta(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke('excluir-conta', { method: 'POST' });
  if (error) throw error;
  // A conta já não existe no servidor; basta esquecer a sessão neste aparelho.
  await supabase.auth.signOut({ scope: 'local' });
  useListaStore.getState().limpar();
  useGestacaoStore.getState().definirDataPrevista(undefined);
}

/** Salva na nuvem o que falta, encerra a sessão e apaga a lista deste aparelho. */
export async function sair(): Promise<void> {
  if (!supabase) return;
  await sincronizar();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  useListaStore.getState().limpar();
}
