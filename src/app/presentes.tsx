import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Switch, View } from 'react-native';

import { Botao } from '@/components/botao';
import { confirmar } from '@/components/confirmar';
import { ThemedText } from '@/components/themed-text';
import { ENDERECO_WEB } from '@/constants/app';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { linkDosPresentes, mensagemDosPresentes } from '@/domain/presentes';
import type { ItemLista } from '@/domain/tipos';
import { usePresentes } from '@/hooks/use-presentes';
import { useTheme } from '@/hooks/use-theme';
import {
  criarLinkPresentes,
  ErroPresentes,
  incluirPresentes,
  liberarPresente,
  tirarPresente,
  trocarLinkPresentes,
} from '@/nuvem/presentes';
import { supabase } from '@/nuvem/supabase';
import { useListaStore } from '@/store/lista';
import { usePermissao, useSessaoStore } from '@/store/sessao';

const mensagemDe = (erro: unknown) =>
  erro instanceof ErroPresentes ? erro.message : 'Algo deu errado. Tente de novo.';

/** Na versão web, o próprio endereço aberto serve de base para o link. */
const enderecoWeb =
  ENDERECO_WEB ??
  (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined);

const porNome = (a: ItemLista, b: ItemLista) =>
  a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });

/** Lista de presentes do chá de bebê: o link para os convidados e o que entra nela. */
export default function PresentesScreen() {
  const theme = useTheme();
  const conectado = useSessaoStore((s) => s.usuario !== null);
  const lista = useSessaoStore((s) => s.lista);
  const permissao = usePermissao();
  const itens = useListaStore((s) => s.itens);
  const { carregado, codigo, presentes, recarregar } = usePresentes();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();

  if (!supabase || !conectado || !lista) {
    return (
      <View style={[styles.conteudo, { backgroundColor: theme.background }]}>
        <ThemedText>
          Monte a lista de presentes do chá de bebê e envie um link aos convidados. Para isso, entre
          na sua conta.
        </ThemedText>
        {supabase && <Botao titulo="Ir para a Conta" onPress={() => router.navigate('/conta')} />}
      </View>
    );
  }

  const listaId = lista.id;
  const podeEditar = permissao === 'total';
  const link = codigo ? linkDosPresentes(enderecoWeb, codigo) : undefined;
  // Os comprados ficam de fora, a não ser que já estejam na lista (um presente que chegou).
  const visiveis = itens.filter((item) => !item.comprado || presentes[item.id]).sort(porNome);
  const faltamIncluir = visiveis.filter((item) => !item.comprado && !presentes[item.id]);

  async function executar(acao: () => Promise<unknown>) {
    setOcupado(true);
    setErro(undefined);
    try {
      await acao();
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setOcupado(false);
      recarregar();
    }
  }

  async function alternar(item: ItemLista, incluir: boolean) {
    if (incluir) return executar(() => incluirPresentes(listaId, [item.id]));
    const reservadoPor = presentes[item.id]?.reservadoPor;
    if (
      reservadoPor &&
      !(await confirmar(
        'Tirar da lista de presentes',
        `${reservadoPor} já escolheu "${item.nome}". Se tirar da lista, essa escolha some.`,
        'Tirar',
      ))
    ) {
      return;
    }
    return executar(() => tirarPresente(listaId, item.id));
  }

  async function liberar(item: ItemLista, reservadoPor: string) {
    if (
      await confirmar(
        'Liberar presente',
        `"${item.nome}" volta a ficar livre para os convidados. ${reservadoPor} deixa de aparecer como quem vai dar.`,
        'Liberar',
      )
    ) {
      executar(() => liberarPresente(item.id));
    }
  }

  async function trocarLink() {
    if (
      await confirmar(
        'Gerar novo link',
        'O link atual para de funcionar. As escolhas que os convidados já fizeram continuam.',
        'Gerar',
      )
    ) {
      executar(trocarLinkPresentes);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.conteudo}>
      <ThemedText themeColor="textSecondary">
        Escolha os itens que podem ser presente e envie o link aos convidados. Eles abrem no
        navegador, sem instalar nada, e marcam o que vão dar. Eles veem só se o presente já foi
        escolhido; vocês veem quem escolheu.
      </ThemedText>

      <View style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">Link para os convidados</ThemedText>
        {!carregado ? (
          <ThemedText type="small" themeColor="textSecondary">
            Carregando…
          </ThemedText>
        ) : !codigo ? (
          podeEditar ? (
            <Botao
              titulo="Criar link"
              desabilitado={ocupado}
              onPress={() => executar(criarLinkPresentes)}
            />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Quem pode editar a lista cria o link.
            </ThemedText>
          )
        ) : link ? (
          <>
            <ThemedText type="small" selectable accessibilityLabel="Link da lista de presentes">
              {link}
            </ThemedText>
            <Botao
              titulo="Enviar link"
              onPress={() =>
                Share.share({
                  message: mensagemDosPresentes(link, lista.nomeDona?.split(' ')[0]),
                }).catch(() => {})
              }
            />
            {podeEditar && (
              <Botao
                titulo="Gerar novo link"
                variante="secundario"
                desabilitado={ocupado}
                onPress={trocarLink}
              />
            )}
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            O link fica pronto quando a versão web do app estiver no ar.
          </ThemedText>
        )}
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">O que entra na lista de presentes</ThemedText>
        {podeEditar && faltamIncluir.length > 0 && (
          <Botao
            titulo={
              faltamIncluir.length === 1
                ? 'Incluir o item que falta comprar'
                : `Incluir os ${faltamIncluir.length} itens que faltam comprar`
            }
            variante="secundario"
            desabilitado={ocupado || !carregado}
            onPress={() =>
              executar(() =>
                incluirPresentes(
                  listaId,
                  faltamIncluir.map((item) => item.id),
                ),
              )
            }
          />
        )}
        {visiveis.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            A lista está vazia. Adicione itens na aba Sugestões.
          </ThemedText>
        ) : (
          visiveis.map((item) => {
            const presente = presentes[item.id];
            return (
              <View
                key={item.id}
                style={[styles.linha, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.textos}>
                  <ThemedText>{item.nome}</ThemedText>
                  {presente?.reservadoPor ? (
                    <ThemedText type="small" style={{ color: theme.primary }}>
                      Escolhido por {presente.reservadoPor}
                    </ThemedText>
                  ) : item.comprado ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Já comprado
                    </ThemedText>
                  ) : null}
                  {presente?.reservadoPor && podeEditar ? (
                    <Botao
                      titulo="Liberar"
                      variante="secundario"
                      desabilitado={ocupado}
                      onPress={() => liberar(item, presente.reservadoPor!)}
                    />
                  ) : null}
                </View>
                <Switch
                  accessibilityLabel={`${item.nome} na lista de presentes`}
                  value={presente !== undefined}
                  onValueChange={(incluir) => alternar(item, incluir)}
                  disabled={!podeEditar || ocupado || !carregado}
                  trackColor={{ true: theme.primary }}
                />
              </View>
            );
          })
        )}
      </View>

      {erro ? (
        <ThemedText accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
          {erro}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  cartao: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  secao: {
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  textos: {
    flex: 1,
    gap: Spacing.one,
  },
});
