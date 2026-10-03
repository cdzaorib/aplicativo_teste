import Head from 'expo-router/head';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PaginaTexto, Paragrafo, Secao, textoContato, Topico } from '@/components/texto-legal';
import { NOME_APP, POLITICA_ATUALIZADA_EM } from '@/constants/app';

/** Política de privacidade (também publicada na versão web, para as lojas). */
export default function PrivacidadeScreen() {
  return (
    <PaginaTexto>
      <Head>
        <title>{`Política de privacidade · ${NOME_APP}`}</title>
      </Head>
      <ThemedText type="subtitle">Política de privacidade</ThemedText>
      <Paragrafo>
        Esta política explica quais dados o app {NOME_APP} usa, para quê e como você pode
        consultá-los ou apagá-los, conforme a Lei Geral de Proteção de Dados (LGPD). Atualizada em{' '}
        {POLITICA_ATUALIZADA_EM}.
      </Paragrafo>

      <Secao titulo="Sem entrar na conta">
        <Paragrafo>
          Você pode usar o app sem conta. Nesse caso, nada sai do seu aparelho: a lista do enxoval,
          a data prevista do parto e a próxima consulta ficam guardadas só nele.
        </Paragrafo>
      </Secao>

      <Secao titulo="Dados da gestação">
        <Paragrafo>
          A data prevista do parto, a data da próxima consulta e as perguntas que você anota para
          ela são dados de saúde. Ficam só no seu aparelho e servem para mostrar a semana da
          gestação, o que é hora de comprar e os avisos que o próprio aparelho agenda. Nunca são
          enviados para a nuvem nem para quem compartilha a lista com você.
        </Paragrafo>
      </Secao>

      <Secao titulo="Com a conta Google">
        <Paragrafo>Ao entrar com o Google, guardamos na nuvem:</Paragrafo>
        <Topico>
          seu nome, e-mail e foto do perfil Google, que o Google envia no login. A foto não é usada
          pelo app;
        </Topico>
        <Topico>
          a sua lista do enxoval (itens, modelos, preços, quantidades e o que já foi comprado), para
          você usar em outro aparelho;
        </Topico>
        <Topico>
          se você compartilhar a lista, quem participa dela, o que cada pessoa pode editar e quem
          marcou cada item como comprado. Seu nome aparece para as pessoas da mesma lista;
        </Topico>
        <Topico>
          os preços que você escolher informar (item, valor, loja e dia). Outras pessoas só veem uma
          faixa calculada com os preços de pelo menos 5 pessoas, nunca o seu preço. Ele fica ligado
          à sua conta só para limitar um preço por item por dia e para ser apagado com ela;
        </Topico>
        <Topico>
          quantas vezes você tentou um código de convite na última hora, para impedir que alguém
          descubra listas de outras pessoas;
        </Topico>
        <Topico>
          se você criar a lista de presentes do chá de bebê, quais itens estão nela e o nome que
          cada convidado digitou ao escolher um presente.
        </Topico>
      </Secao>

      <Secao titulo="Lista de presentes do chá de bebê">
        <Paragrafo>
          Quem tem o link da lista de presentes vê, sem login, o seu primeiro nome e os itens que
          você colocou nela, com nome, modelo e quantidade. Não vê seu e-mail, preços, a data
          prevista nem o resto da lista. Você pode gerar um novo link a qualquer momento, e o antigo
          para de funcionar.
        </Paragrafo>
        <Paragrafo>
          O convidado que escolhe um presente digita um nome. Só as pessoas da sua lista veem esse
          nome; os outros convidados veem apenas que o presente já foi escolhido. O aparelho do
          convidado guarda uma chave para ele poder desfazer a escolha. Esses dados são apagados
          quando o item sai da lista de presentes ou quando a sua conta é excluída.
        </Paragrafo>
      </Secao>

      <Secao titulo="Com quem os dados ficam">
        <Paragrafo>
          Os dados da conta ficam no Supabase, serviço de banco de dados com servidores em São
          Paulo, Brasil. O login é feito pelo Google. Não vendemos dados, não mostramos anúncios e
          não usamos ferramentas de rastreamento de terceiros.
        </Paragrafo>
        <Paragrafo>
          Os botões das lojas abrem o site de cada loja. A partir daí, valem as regras de
          privacidade da loja.
        </Paragrafo>
      </Secao>

      <Secao titulo="Por quanto tempo e como apagar">
        <Paragrafo>
          Os dados ficam guardados enquanto a sua conta existir. Você pode excluir a conta a
          qualquer momento: tudo o que está ligado a ela é apagado na hora. Cópias de segurança do
          provedor podem manter os dados por um período limitado antes de serem descartadas.
        </Paragrafo>
        <Link href="/excluir-conta">
          <ThemedText type="linkPrimary">Como excluir a conta</ThemedText>
        </Link>
      </Secao>

      <Secao titulo="Seus direitos">
        <Paragrafo>
          Pela LGPD, você pode pedir a confirmação de que tratamos seus dados, acesso a eles,
          correção, portabilidade, exclusão e informações sobre com quem eles são compartilhados.
          Basta escrever para {textoContato()}.
        </Paragrafo>
      </Secao>

      <Secao titulo="Para quem é o app">
        <Paragrafo>
          O app é feito para adultos que preparam o enxoval. Não coletamos dados de crianças.
        </Paragrafo>
      </Secao>

      <Secao titulo="Mudanças nesta política">
        <Paragrafo>
          Se esta política mudar, a nova versão aparece aqui com a data de atualização. Mudanças
          importantes também serão avisadas no app.
        </Paragrafo>
      </Secao>
    </PaginaTexto>
  );
}
