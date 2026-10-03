import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AvaliacaoPreco, FaixaReferencia } from '@/components/avaliacao-preco';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { Chips } from '@/components/chips';
import { PrioridadeBadge } from '@/components/prioridade-badge';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { CATALOGO } from '@/domain/catalogo';
import { formatarPreco, lerPreco } from '@/domain/lista';
import {
  avaliarPreco,
  LOJAS,
  ORIGENS_PRECO,
  linkDeBusca,
  type Loja,
  type OrigemPreco,
  unidadeDePreco,
} from '@/domain/precos';
import { useReferencia } from '@/hooks/use-referencia';
import { useTheme } from '@/hooks/use-theme';
import { informarPreco } from '@/nuvem/precos';
import { useListaStore } from '@/store/lista';
import { usePermissao, useSessaoStore } from '@/store/sessao';

type Envio = 'enviando' | 'enviado' | 'erro';

export default function CompararPrecoScreen() {
  const theme = useTheme();
  const { catalogoId } = useLocalSearchParams<{ catalogoId: string }>();
  const item = CATALOGO.find((c) => c.id === catalogoId);
  const referencia = useReferencia(catalogoId);
  const usuario = useSessaoStore((s) => s.usuario);
  const naLista = useListaStore((s) => s.itens.find((i) => i.catalogoId === catalogoId));
  const { adicionarDoCatalogo, atualizar } = useListaStore.getState();
  const permissao = usePermissao();
  // Atualizar o preço de um item que já está na lista exige permissão de preços; adicionar, de lista.
  const podeUsarNaLista = naLista ? permissao !== 'leitura' : permissao === 'total';

  const [texto, setTexto] = useState('');
  const [origem, setOrigem] = useState<OrigemPreco>();
  const [compartilhar, setCompartilhar] = useState(true);
  const [avaliado, setAvaliado] = useState<number>();
  const [erro, setErro] = useState<string>();
  const [envio, setEnvio] = useState<Envio>();
  const [salvoNaLista, setSalvoNaLista] = useState(false);

  if (!item || item.prioridade === 'evitar') {
    return (
      <View style={[styles.conteudo, { backgroundColor: theme.background }]}>
        <ThemedText themeColor="textSecondary">
          Este item não está disponível para comparação de preços.
        </ThemedText>
      </View>
    );
  }
  const itemCatalogo = item;

  function avaliar() {
    const preco = lerPreco(texto);
    if (!preco) {
      setErro('Digite um valor como 749,90.');
      return;
    }
    setErro(undefined);
    setAvaliado(preco);
    setSalvoNaLista(false);
    setEnvio(undefined);
    if (usuario && compartilhar) {
      setEnvio('enviando');
      informarPreco(itemCatalogo.id, preco, origem)
        .then(() => setEnvio('enviado'))
        .catch(() => setEnvio('erro'));
    }
  }

  function usarNaLista(preco: number) {
    if (!naLista) adicionarDoCatalogo([itemCatalogo]);
    const naListaAgora = useListaStore
      .getState()
      .itens.find((i) => i.catalogoId === itemCatalogo.id);
    if (naListaAgora) atualizar(naListaAgora.id, { precoCentavos: preco });
    setSalvoNaLista(true);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, styles.espacado]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.titulo}>
        <ThemedText type="smallBold" style={styles.nome}>
          {item.nome}
        </ThemedText>
        <PrioridadeBadge prioridade={item.prioridade} />
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <FaixaReferencia referencia={referencia} unidade={unidadeDePreco(item.id)} />
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">Ver opções nas lojas</ThemedText>
        <View style={styles.lojas}>
          {(Object.keys(LOJAS) as Loja[]).map((loja) => (
            <Pressable
              key={loja}
              accessibilityRole="link"
              accessibilityLabel={`Buscar ${item.nome} no ${LOJAS[loja]}`}
              onPress={() => Linking.openURL(linkDeBusca(loja, item.busca))}
              style={({ pressed }) => [
                styles.loja,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressionado,
              ]}>
              <ThemedText type="smallBold">{LOJAS[loja]}</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">Achou um preço? Digite aqui</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Dizemos se ele está caro, na média ou barato demais para ser verdade.
        </ThemedText>
        <Campo
          rotulo={`Preço encontrado por ${unidadeDePreco(item.id)} (R$)`}
          placeholder="0,00"
          keyboardType="decimal-pad"
          value={texto}
          onChangeText={setTexto}
          onSubmitEditing={avaliar}
          erro={erro}
        />
        <Chips
          rotulo="Onde você achou"
          opcoes={ORIGENS_PRECO}
          valor={origem}
          onChange={setOrigem}
        />
        {usuario ? (
          <View style={styles.linhaSwitch}>
            <ThemedText type="small" style={styles.textoSwitch}>
              Compartilhar de forma anônima para melhorar a referência de outras famílias
            </ThemedText>
            <Switch
              accessibilityLabel="Compartilhar preço de forma anônima"
              value={compartilhar}
              onValueChange={setCompartilhar}
              trackColor={{ true: theme.primary }}
            />
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Entre na sua conta (aba Conta) para compartilhar preços e ajudar outras famílias.
          </ThemedText>
        )}
        <Botao titulo="Avaliar preço" onPress={avaliar} />
      </View>

      {avaliado !== undefined && (
        <View style={styles.secao}>
          {referencia ? (
            <AvaliacaoPreco
              avaliacao={avaliarPreco(avaliado, referencia.faixa)}
              exigeInmetro={item.inmetro}
            />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Ainda não dá para avaliar: falta referência para este item. Cada preço compartilhado
              ajuda a criar uma.
            </ThemedText>
          )}
          {envio && (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={envio === 'erro' ? { color: theme.danger } : undefined}>
              {
                {
                  enviando: 'Compartilhando…',
                  enviado: 'Obrigado! Seu preço foi compartilhado de forma anônima.',
                  erro: 'Não foi possível compartilhar agora. A avaliação continua valendo.',
                }[envio]
              }
            </ThemedText>
          )}
          {salvoNaLista ? (
            <ThemedText type="small" themeColor="textSecondary">
              Preço de {formatarPreco(avaliado)} salvo na sua lista.
            </ThemedText>
          ) : (
            podeUsarNaLista && (
              <Botao
                titulo={
                  naLista ? 'Usar este preço na minha lista' : 'Adicionar à lista com este preço'
                }
                variante="secundario"
                onPress={() => usarNaLista(avaliado)}
              />
            )
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  espacado: {
    gap: Spacing.four,
  },
  titulo: {
    gap: Spacing.one,
  },
  nome: {
    fontSize: 20,
    lineHeight: 28,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  secao: {
    gap: Spacing.two,
  },
  lojas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  loja: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  pressionado: {
    opacity: 0.7,
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  textoSwitch: {
    flex: 1,
  },
});
