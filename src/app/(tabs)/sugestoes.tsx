import { useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { AvisoRevisao } from '@/components/aviso-revisao';
import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { CatalogoCard } from '@/components/catalogo-card';
import { Chips } from '@/components/chips';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { combinaComBusca } from '@/domain/busca';
import { CATALOGO } from '@/domain/catalogo';
import { eHoraDeComprar } from '@/domain/gestacao';
import { CATEGORIAS, PRIORIDADES, type Categoria, type Prioridade } from '@/domain/tipos';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { useSemanasDeGestacao } from '@/store/gestacao';
import { useListaStore } from '@/store/lista';
import { usePermissao } from '@/store/sessao';

type Filtro = Prioridade | 'todas';

const FILTROS: Record<Filtro, string> = { todas: 'Todas', ...PRIORIDADES };

const ESSENCIAIS = CATALOGO.filter((item) => item.prioridade === 'essencial');

export default function SugestoesScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busca, setBusca] = useState('');
  const itens = useListaStore((s) => s.itens);
  const adicionarDoCatalogo = useListaStore((s) => s.adicionarDoCatalogo);
  const podeAdicionar = usePermissao() === 'total';
  const semanas = useSemanasDeGestacao();

  const naLista = new Set(itens.map((i) => i.catalogoId));
  const essenciaisFaltando = ESSENCIAIS.filter((item) => !naLista.has(item.id));

  const filtrados = CATALOGO.filter(
    (item) => (filtro === 'todas' || item.prioridade === filtro) && combinaComBusca(item, busca),
  );
  const secoes = (Object.keys(CATEGORIAS) as Categoria[])
    .map((categoria) => ({
      titulo: CATEGORIAS[categoria],
      data: filtrados.filter((item) => item.categoria === categoria),
    }))
    .filter((secao) => secao.data.length > 0);

  return (
    <SectionList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, insets]}
      sections={secoes}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      renderItem={({ item }) => (
        <CatalogoCard
          item={item}
          naLista={naLista.has(item.id)}
          horaDeComprar={semanas !== undefined && eHoraDeComprar(item.quando, semanas)}
          onAdicionar={podeAdicionar ? () => adicionarDoCatalogo([item]) : undefined}
        />
      )}
      renderSectionHeader={({ section }) => (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.secao}>
          {section.titulo.toUpperCase()}
        </ThemedText>
      )}
      ItemSeparatorComponent={Separador}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.secao}>
          Nenhum item encontrado. Tente outra palavra ou adicione um item seu na aba Minha lista.
        </ThemedText>
      }
      ListHeaderComponent={
        <View style={styles.cabecalho}>
          <ThemedText type="subtitle">Sugestões</ThemedText>
          <ThemedText themeColor="textSecondary">
            O que comprar, quando comprar e o que evitar no enxoval.
          </ThemedText>
          <AvisoRevisao />
          {podeAdicionar && essenciaisFaltando.length > 0 && (
            <Botao
              titulo={`Adicionar ${essenciaisFaltando.length} itens essenciais`}
              onPress={() => adicionarDoCatalogo(essenciaisFaltando)}
            />
          )}
          <Campo
            rotulo="Buscar no catálogo"
            placeholder="Ex.: berço, body, fralda…"
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Chips
            rotulo="Filtrar por prioridade"
            opcoes={FILTROS}
            valor={filtro}
            onChange={setFiltro}
          />
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
  cabecalho: {
    gap: Spacing.three,
  },
  secao: {
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  separador: {
    height: Spacing.two,
  },
});
