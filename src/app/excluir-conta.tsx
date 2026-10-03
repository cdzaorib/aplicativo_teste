import Head from 'expo-router/head';

import { ThemedText } from '@/components/themed-text';
import { PaginaTexto, Paragrafo, Secao, textoContato, Topico } from '@/components/texto-legal';
import { NOME_APP } from '@/constants/app';

/**
 * Como excluir a conta. Também publicada na versão web: o Google Play pede um endereço onde a
 * pessoa consiga pedir a exclusão sem o app.
 */
export default function ExcluirContaScreen() {
  return (
    <PaginaTexto>
      <Head>
        <title>{`Excluir a conta · ${NOME_APP}`}</title>
      </Head>
      <ThemedText type="subtitle">Excluir a conta do {NOME_APP}</ThemedText>

      <Secao titulo="Pelo app">
        <Topico>Abra a aba Conta.</Topico>
        <Topico>Toque em &quot;Excluir minha conta&quot; e confirme.</Topico>
        <Paragrafo>A exclusão é imediata e não dá para desfazer.</Paragrafo>
      </Secao>

      <Secao titulo="Sem o app">
        <Paragrafo>
          Escreva para {textoContato()} a partir do e-mail da sua conta Google, pedindo a exclusão.
          Respondemos em até 15 dias.
        </Paragrafo>
      </Secao>

      <Secao titulo="O que é apagado">
        <Topico>a sua conta e os dados que vieram do Google (nome, e-mail e foto);</Topico>
        <Topico>a sua lista do enxoval guardada na nuvem;</Topico>
        <Topico>a sua participação em listas compartilhadas;</Topico>
        <Topico>os preços que você informou;</Topico>
        <Topico>a contagem de tentativas de código de convite.</Topico>
        <Paragrafo>
          Se você era dona de uma lista compartilhada, as pessoas convidadas voltam para as próprias
          listas, com uma cópia dos itens. Itens que você adicionou na lista de outra pessoa
          continuam na lista dela, sem nenhum dado seu.
        </Paragrafo>
        <Paragrafo>
          A lista e a data prevista do parto guardadas no aparelho são apagadas ao excluir a conta
          pelo app ou ao desinstalá-lo.
        </Paragrafo>
      </Secao>
    </PaginaTexto>
  );
}
