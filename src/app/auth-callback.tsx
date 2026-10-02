import { Redirect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { concluirLogin } from '@/nuvem/auth';

// Na web, o login abre numa janela separada que carrega esta rota; isto devolve o resultado
// para a janela do app e fecha a janela de login. No celular não faz nada.
WebBrowser.maybeCompleteAuthSession();

/** Destino da volta do login com Google. */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    // No Android a volta do login também chega aqui. Se o sistema fechou o app enquanto a pessoa
    // estava no navegador, só esta rota recebe o código. Na web, quem troca o código é a janela
    // do app, não a de login.
    if (Platform.OS !== 'web' && code) {
      // Um erro aqui deixa a pessoa desconectada na tela Conta, onde ela pode tentar de novo.
      concluirLogin(code).catch(() => {});
    }
  }, [code]);

  return <Redirect href="/conta" />;
}
