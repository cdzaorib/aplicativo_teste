import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { SeloAvaliacao } from '@/components/avaliacao-preco';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { formatarData } from '@/domain/gestacao';
import { resumirHistorico, type ResumoHistorico } from '@/domain/historico';
import { formatarPreco } from '@/domain/lista';
import { avaliarPreco, type FaixaPreco } from '@/domain/precos';
import type { UnidadePreco } from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';
import type { Oferta } from '@/nuvem/linhas';
import { buscarHistorico, buscarOfertas, DIAS_HISTORICO } from '@/nuvem/ofertas';

type Props = {
  catalogoId: string;
  /** Faixa comum do item, para dizer se cada oferta está barata, na média ou cara. */
  faixa?: FaixaPreco;
  unidade: UnidadePreco;
};

/**
 * Ofertas da Shopee coletadas para o item (Fase 2b). Enquanto não houver ofertas, por exemplo
 * antes de a coleta ser ligada, não mostra nada.
 */
export function OfertasLoja({ catalogoId, faixa, unidade }: Props) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [historico, setHistorico] = useState<ResumoHistorico>();

  useEffect(() => {
    let ativo = true;
    buscarOfertas(catalogoId)
      .then((encontradas) => ativo && setOfertas(encontradas))
      // Sem internet, a tela continua útil com a faixa e os links das lojas.
      .catch(() => ativo && setOfertas([]));
    buscarHistorico(catalogoId)
      .then((dias) => ativo && setHistorico(resumirHistorico(dias)))
      .catch(() => ativo && setHistorico(undefined));
    return () => {
      ativo = false;
    };
  }, [catalogoId]);

  if (ofertas.length === 0) return null;
  const atualizadas = new Date(Math.max(...ofertas.map((o) => o.coletadoEm)));

  return (
    <View style={styles.secao}>
      <ThemedText type="smallBold">Ofertas na Shopee</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Preço por {unidade}, atualizado em {atualizadas.toLocaleDateString('pt-BR')}. Confira na
        loja antes de comprar.
      </ThemedText>
      {historico && historico.dias > 1 && (
        <ThemedText type="small">
          Menor preço nos últimos {DIAS_HISTORICO} dias:{' '}
          {formatarPreco(historico.menor.precoCentavos)} em {formatarData(historico.menor.dia)}.
          Hoje: {formatarPreco(historico.atualCentavos)}.
        </ThemedText>
      )}
      {ofertas.map((oferta) => (
        <CartaoOferta key={oferta.produtoId} oferta={oferta} faixa={faixa} />
      ))}
    </View>
  );
}

function CartaoOferta({ oferta, faixa }: { oferta: Oferta; faixa?: FaixaPreco }) {
  const theme = useTheme();
  const preco =
    oferta.precoMaxCentavos > oferta.precoMinCentavos
      ? `${formatarPreco(oferta.precoMinCentavos)} a ${formatarPreco(oferta.precoMaxCentavos)}`
      : formatarPreco(oferta.precoMinCentavos);
  const detalhes = [
    oferta.avaliacao !== undefined && `★ ${oferta.avaliacao.toLocaleString('pt-BR')}`,
    oferta.vendas !== undefined && `${oferta.vendas.toLocaleString('pt-BR')} vendidos`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${oferta.nome}, ${preco}. Abrir na Shopee`}
      onPress={() => Linking.openURL(oferta.link)}
      style={({ pressed }) => [
        styles.cartao,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressionado,
      ]}>
      {oferta.imagemUrl ? (
        <Image source={{ uri: oferta.imagemUrl }} style={styles.imagem} contentFit="cover" />
      ) : null}
      <View style={styles.textos}>
        <ThemedText type="small" numberOfLines={2}>
          {oferta.nome}
        </ThemedText>
        <ThemedText type="smallBold">{preco}</ThemedText>
        {detalhes ? (
          <ThemedText type="small" themeColor="textSecondary">
            {detalhes}
          </ThemedText>
        ) : null}
        {faixa && <SeloAvaliacao avaliacao={avaliarPreco(oferta.precoMinCentavos, faixa)} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: Spacing.two,
  },
  cartao: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  pressionado: {
    opacity: 0.7,
  },
  imagem: {
    width: 64,
    height: 64,
    borderRadius: Radius.small,
  },
  textos: {
    flex: 1,
    gap: Spacing.one,
  },
});
