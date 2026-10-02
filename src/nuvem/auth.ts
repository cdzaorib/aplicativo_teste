import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';
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

  const { error: erroSessao } = await supabase.auth.exchangeCodeForSession(codigo);
  if (erroSessao) throw erroSessao;
  return true;
}

/** Salva na nuvem o que falta, encerra a sessão e apaga a lista deste aparelho. */
export async function sair(): Promise<void> {
  if (!supabase) return;
  await sincronizar();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  useListaStore.getState().limpar();
}
