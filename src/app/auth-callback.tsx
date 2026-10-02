import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Na web, o login abre numa janela separada que carrega esta rota; isto devolve o resultado
// para a janela do app e fecha a janela de login. No celular não faz nada.
WebBrowser.maybeCompleteAuthSession();

/** Destino da volta do login com Google (o código é tratado em src/nuvem/auth.ts). */
export default function AuthCallback() {
  return <Redirect href="/conta" />;
}
