import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HoraDeComprarBadge } from '@/components/hora-de-comprar-badge';
import { Icone } from '@/components/icone';
import { PrioridadeBadge } from '@/components/prioridade-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { formatarPreco } from '@/domain/lista';
import type { ItemLista } from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  item: ItemLista;
  onAlternar: () => void;
  /** Numa lista compartilhada só de leitura (ou só de preços), não dá para marcar como comprado. */
  podeMarcar?: boolean;
  /** A fase de comprar o item já chegou (pela data prevista do parto). */
  horaDeComprar?: boolean;
  /** Numa lista compartilhada, o nome de quem comprou, se não foi a própria pessoa. */
  compradoPor?: string;
};

export function ItemListaLinha({
  item,
  onAlternar,
  podeMarcar = true,
  horaDeComprar,
  compradoPor,
}: Props) {
  const theme = useTheme();
  const detalhes = [item.modelo, item.quantidade > 1 ? `${item.quantidade} un.` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.linha, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.comprado, disabled: !podeMarcar }}
        accessibilityLabel={`Marcar ${item.nome} como comprado`}
        disabled={!podeMarcar}
        hitSlop={8}
        onPress={onAlternar}
        style={!podeMarcar && styles.bloqueado}>
        <Icone
          nome={item.comprado ? 'marcado' : 'desmarcado'}
          cor={item.comprado ? theme.primary : theme.textSecondary}
          tamanho={26}
        />
      </Pressable>

      <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild>
        <Pressable style={styles.conteudo} accessibilityHint="Abre os detalhes do item">
          <View style={styles.textos}>
            <ThemedText
              style={item.comprado && styles.comprado}
              themeColor={item.comprado ? 'textSecondary' : 'text'}>
              {item.nome}
            </ThemedText>
            {detalhes ? (
              <ThemedText type="small" themeColor="textSecondary">
                {detalhes}
              </ThemedText>
            ) : null}
            {compradoPor ? (
              <ThemedText type="small" themeColor="textSecondary">
                Comprado por {compradoPor}
              </ThemedText>
            ) : null}
            <View style={styles.selos}>
              <PrioridadeBadge prioridade={item.prioridade} />
              {horaDeComprar && <HoraDeComprarBadge />}
            </View>
          </View>
          <ThemedText
            type="smallBold"
            themeColor={item.precoCentavos !== undefined ? 'text' : 'textSecondary'}>
            {item.precoCentavos !== undefined
              ? formatarPreco(item.precoCentavos * item.quantidade)
              : 'Sem preço'}
          </ThemedText>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  conteudo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  textos: {
    flex: 1,
    gap: Spacing.one,
  },
  selos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  bloqueado: {
    opacity: 0.5,
  },
  comprado: {
    textDecorationLine: 'line-through',
  },
});
