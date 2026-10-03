import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Share, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Chips } from '@/components/chips';
import { ItemListaLinha } from '@/components/item-lista-linha';
import { QuandoComprar } from '@/components/quando-comprar';
import { ResumoCard } from '@/components/resumo-card';
import { ThemedText } from '@/components/themed-text';
import { vibrarAoMarcar } from '@/components/vibrar';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { eHoraDeComprar, quandoDoItem } from '@/domain/gestacao';
import { filtrarLista, ordenarLista, resumirLista } from '@/domain/lista';
import { listaComoTexto } from '@/domain/texto-lista';
import { FILTROS, ORDENS, type FiltroLista } from '@/domain/tipos';
import { useNomeDoComprador } from '@/hooks/use-nomes-da-lista';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { sincronizar } from '@/nuvem/sincronizar';
import { useSemanasDeGestacao } from '@/store/gestacao';
import { useListaStore } from '@/store/lista';
import { usePermissao, useSessaoStore } from '@/store/sessao';

/** O que mostrar a quem abre o app pela primeira vez, com a lista vazia. */
const PRIMEIROS_PASSOS = [
  'Veja as sugestões: o que é essencial, útil, opcional ou desaconselhado, com a fonte de cada item. Com um toque, dá para adicionar todos os essenciais.',
  'Informe a data prevista do parto, aqui em cima, para saber o que já é hora de comprar.',
  'Na aba Conta, entre com o Google para salvar a lista na nuvem e montar o enxoval junto com quem você quiser.',
];

export default function MinhaListaScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();
  const itens = useListaStore((s) => s.itens);
  const ordem = useListaStore((s) => s.ordem);
  const definirOrdem = useListaStore((s) => s.definirOrdem);
  const alternarComprado = useListaStore((s) => s.alternarComprado);
  const permissao = usePermissao();
  const lista = useSessaoStore((s) => (s.usuario ? s.lista : undefined));
  const compartilhada = lista && !lista.souDona;
  const semanas = useSemanasDeGestacao();
  const nomeDoComprador = useNomeDoComprador();
  const conectado = useSessaoStore((s) => s.usuario !== null);
  const [atualizando, setAtualizando] = useState(false);
  // Não fica salvo: ao abrir o app de novo, a lista aparece inteira.
  const [mostrar, setMostrar] = useState<FiltroLista>('todos');

  // Puxar a lista para baixo sincroniza na hora. Um erro aparece na aba Conta.
  async function atualizar() {
    setAtualizando(true);
    await sincronizar().catch(() => {});
    setAtualizando(false);
  }

  const vazia = itens.length === 0;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, insets]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      data={filtrarLista(ordenarLista(itens, ordem), mostrar)}
      keyExtractor={(item) => item.id}
      refreshing={atualizando}
      onRefresh={conectado ? atualizar : undefined}
      renderItem={({ item }) => (
        <ItemListaLinha
          item={item}
          onAlternar={() => {
            vibrarAoMarcar(!item.comprado);
            alternarComprado(item.id);
          }}
          podeMarcar={permissao === 'total'}
          horaDeComprar={
            semanas !== undefined && !item.comprado && eHoraDeComprar(quandoDoItem(item), semanas)
          }
          compradoPor={nomeDoComprador(item)}
        />
      )}
      ItemSeparatorComponent={Separador}
      ListHeaderComponent={
        <View style={styles.cabecalho}>
          <ThemedText type="subtitle">Minha lista</ThemedText>
          {compartilhada && (
            <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">
                Lista compartilhada{lista.nomeDona ? ` de ${lista.nomeDona}` : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {
                  {
                    total: 'Você pode editar a lista e os preços.',
                    precos: 'Você pode editar os preços. O resto só a dona da lista libera.',
                    leitura: 'Você pode ver a lista. Para editar, peça permissão à dona da lista.',
                  }[permissao]
                }
              </ThemedText>
            </View>
          )}
          <QuandoComprar itens={itens} />
          {!vazia && (
            <>
              <ResumoCard resumo={resumirLista(itens)} />
              <View style={styles.ordenacao}>
                <ThemedText type="small" themeColor="textSecondary">
                  Mostrar
                </ThemedText>
                <Chips rotulo="Mostrar" opcoes={FILTROS} valor={mostrar} onChange={setMostrar} />
              </View>
              <View style={styles.ordenacao}>
                <ThemedText type="small" themeColor="textSecondary">
                  Ordenar por
                </ThemedText>
                <Chips rotulo="Ordenar por" opcoes={ORDENS} valor={ordem} onChange={definirOrdem} />
              </View>
            </>
          )}
        </View>
      }
      ListEmptyComponent={
        vazia ? (
          <View style={styles.vazia}>
            {permissao === 'total' ? (
              <>
                <ThemedText type="smallBold">Por onde começar</ThemedText>
                {PRIMEIROS_PASSOS.map((passo, i) => (
                  <ThemedText key={passo} themeColor="textSecondary">
                    {i + 1}. {passo}
                  </ThemedText>
                ))}
              </>
            ) : (
              <ThemedText themeColor="textSecondary">A lista ainda está vazia.</ThemedText>
            )}
            <Botao titulo="Ver sugestões" onPress={() => router.navigate('/sugestoes')} />
          </View>
        ) : (
          <ThemedText themeColor="textSecondary">
            {mostrar === 'falta'
              ? 'Tudo comprado! Não falta nenhum item da lista.'
              : 'Nenhum item comprado ainda.'}
          </ThemedText>
        )
      }
      ListFooterComponent={
        <View style={styles.rodape}>
          {permissao === 'total' && (
            <Botao
              titulo="Adicionar item próprio"
              variante="secundario"
              onPress={() => router.push('/item/novo')}
            />
          )}
          {!vazia && (
            <Botao
              titulo="Enviar a lista por mensagem"
              variante="secundario"
              onPress={() =>
                // Sem a folha de compartilhamento (ex.: alguns navegadores), não faz nada.
                Share.share({ message: listaComoTexto(itens) }).catch(() => {})
              }
            />
          )}
        </View>
      }
    />
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  aviso: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  cabecalho: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  ordenacao: {
    gap: Spacing.two,
  },
  vazia: {
    gap: Spacing.three,
  },
  rodape: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  separador: {
    height: Spacing.two,
  },
});
