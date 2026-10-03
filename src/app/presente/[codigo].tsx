import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { ThemedText } from '@/components/themed-text';
import { NOME_APP } from '@/constants/app';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { FAIXAS_PESQUISADAS } from '@/domain/faixas-preco';
import { formatarPreco } from '@/domain/lista';
import { unidadeDePreco } from '@/domain/precos';
import { ordenarPresentes, type ItemPresente, type ListaPresentes } from '@/domain/presentes';
import { useTheme } from '@/hooks/use-theme';
import {
  desfazerReservaPresente,
  ErroPresentes,
  reservarPresente,
  verListaPresentes,
} from '@/nuvem/presentes';
import { chaveDaEscolha, useEscolhasPresentesStore } from '@/store/escolhas-presentes';

const mensagemDe = (erro: unknown) =>
  erro instanceof ErroPresentes ? erro.message : 'Algo deu errado. Tente de novo.';

/**
 * Página que os convidados do chá de bebê abrem pelo link, sem login: mostram quais presentes
 * ainda estão livres e marcam o que vão dar.
 */
export default function ListaDePresentesScreen() {
  const theme = useTheme();
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  // undefined: carregando; null: link inválido.
  const [lista, setLista] = useState<ListaPresentes | null>();
  const [erro, setErro] = useState<string>();

  // Aumenta para buscar a lista de novo (depois de escolher, desfazer ou de um erro).
  const [buscas, setBuscas] = useState(0);
  const carregar = () => setBuscas((n) => n + 1);

  useEffect(() => {
    let ativo = true;
    verListaPresentes(codigo)
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
        setErro(undefined);
      })
      .catch((e) => ativo && setErro(mensagemDe(e)));
    return () => {
      ativo = false;
    };
  }, [codigo, buscas]);

  const titulo = lista?.nome ? `Chá de bebê de ${lista.nome}` : 'Lista de presentes';

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <Head>
        <title>{`${titulo} · ${NOME_APP}`}</title>
      </Head>
      <ThemedText type="subtitle" accessibilityRole="header">
        {titulo}
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Escolha um presente e toque em &quot;Vou dar este&quot;, para ninguém dar o mesmo. Só a
        família vê quem escolheu.
      </ThemedText>

      {erro ? (
        <View style={styles.secao}>
          <ThemedText accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
            {erro}
          </ThemedText>
          <Botao titulo="Tentar de novo" variante="secundario" onPress={carregar} />
        </View>
      ) : lista === undefined ? (
        <ThemedText themeColor="textSecondary">Carregando a lista…</ThemedText>
      ) : lista === null ? (
        <ThemedText>Este link não vale mais. Peça o link novo a quem enviou.</ThemedText>
      ) : lista.itens.length === 0 ? (
        <ThemedText>A lista ainda não tem presentes. Volte daqui a pouco.</ThemedText>
      ) : (
        ordenarPresentes(lista.itens).map((item) => (
          <CartaoPresente key={item.id} codigo={codigo} item={item} aoMudar={carregar} />
        ))
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Lista feita no app {NOME_APP}. O nome que você digitar fica guardado com a escolha, para a
        família saber quem vai dar o quê.
      </ThemedText>
    </ScrollView>
  );
}

function CartaoPresente({
  codigo,
  item,
  aoMudar,
}: {
  codigo: string;
  item: ItemPresente;
  aoMudar: () => void;
}) {
  const theme = useTheme();
  const nomeSalvo = useEscolhasPresentesStore((s) => s.nome);
  const minhaChave = useEscolhasPresentesStore((s) => s.chaves[chaveDaEscolha(codigo, item.id)]);
  const { lembrar, esquecer } = useEscolhasPresentesStore.getState();
  const [escolhendo, setEscolhendo] = useState(false);
  const [nome, setNome] = useState(nomeSalvo);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();

  const escolhidoPorMim = item.situacao === 'reservado' && minhaChave !== undefined;
  const faixa = item.catalogoId ? FAIXAS_PESQUISADAS[item.catalogoId] : undefined;
  const detalhes = [item.modelo, item.quantidade > 1 ? `${item.quantidade} unidades` : '']
    .filter(Boolean)
    .join(' · ');

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setErro(undefined);
    try {
      await acao();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
      aoMudar();
    }
  }

  const confirmar = () =>
    executar(async () => {
      const chave = await reservarPresente(codigo, item.id, nome);
      lembrar(codigo, item.id, chave, nome.trim());
      setEscolhendo(false);
    });

  const desfazer = () =>
    executar(async () => {
      await desfazerReservaPresente(codigo, item.id, minhaChave!);
      esquecer(codigo, item.id);
    });

  return (
    <View style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{item.nome}</ThemedText>
      {detalhes ? (
        <ThemedText type="small" themeColor="textSecondary">
          {detalhes}
        </ThemedText>
      ) : null}
      {faixa && item.situacao === 'livre' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Costuma custar de {formatarPreco(faixa.minCentavos)} a {formatarPreco(faixa.maxCentavos)}{' '}
          por {unidadeDePreco(item.catalogoId)}.
        </ThemedText>
      ) : null}

      {escolhidoPorMim ? (
        <>
          <ThemedText type="small" style={{ color: theme.primary }}>
            Você escolheu este presente. A família agradece!
          </ThemedText>
          <Botao
            titulo="Desfazer"
            variante="secundario"
            desabilitado={ocupado}
            onPress={desfazer}
          />
        </>
      ) : item.situacao === 'reservado' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Já escolhido por alguém.
        </ThemedText>
      ) : item.situacao === 'comprado' ? (
        <ThemedText type="small" themeColor="textSecondary">
          A família já tem este.
        </ThemedText>
      ) : escolhendo ? (
        <>
          <Campo
            rotulo="Seu nome"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex.: Tia Maria"
            autoComplete="name"
            maxLength={60}
            autoFocus
          />
          <Botao
            titulo={ocupado ? 'Marcando…' : 'Confirmar'}
            desabilitado={ocupado || nome.trim() === ''}
            onPress={confirmar}
          />
          <Botao titulo="Cancelar" variante="secundario" onPress={() => setEscolhendo(false)} />
        </>
      ) : (
        <Botao titulo="Vou dar este" onPress={() => setEscolhendo(true)} />
      )}

      {erro ? (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
          {erro}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  secao: {
    gap: Spacing.two,
  },
  cartao: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
});
