import { Pressable, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { PrioridadeBadge } from '@/components/prioridade-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { QUANDO, type ItemCatalogo } from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  item: ItemCatalogo;
  naLista: boolean;
  onAdicionar: () => void;
};

export function CatalogoCard({ item, naLista, onAdicionar }: Props) {
  const theme = useTheme();
  const evitar = item.prioridade === 'evitar';

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.topo}>
        <View style={styles.titulo}>
          <ThemedText type="smallBold">{item.nome}</ThemedText>
          <View style={styles.etiquetas}>
            <PrioridadeBadge prioridade={item.prioridade} />
            {!evitar && (
              <ThemedText type="small" themeColor="textSecondary">
                {QUANDO[item.quando]}
                {item.quantidade > 1 ? ` · ${item.quantidade} un.` : ''}
              </ThemedText>
            )}
          </View>
        </View>
        <Acao evitar={evitar} naLista={naLista} nome={item.nome} onAdicionar={onAdicionar} />
      </View>

      <ThemedText type="small">{item.porque}</ThemedText>

      {item.inmetro && (
        <View style={styles.inmetro}>
          <Icone nome="selo" cor={theme.textSecondary} tamanho={16} />
          <ThemedText type="small" themeColor="textSecondary">
            Exige selo do Inmetro
          </ThemedText>
        </View>
      )}
      {item.fonte && (
        <ThemedText type="small" themeColor="textSecondary">
          Fonte: {item.fonte}
        </ThemedText>
      )}
    </View>
  );
}

type AcaoProps = {
  evitar: boolean;
  naLista: boolean;
  nome: string;
  onAdicionar: () => void;
};

function Acao({ evitar, naLista, nome, onAdicionar }: AcaoProps) {
  const theme = useTheme();

  if (evitar) {
    return (
      <View style={styles.acao} accessibilityLabel="Não recomendado">
        <Icone nome="aviso" cor={theme.evitarText} />
      </View>
    );
  }

  if (naLista) {
    return (
      <View style={styles.acao} accessibilityLabel={`${nome} já está na lista`}>
        <Icone nome="check" cor={theme.primary} />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Adicionar ${nome} à lista`}
      hitSlop={8}
      onPress={onAdicionar}
      style={({ pressed }) => [
        styles.acao,
        styles.botaoAdicionar,
        { backgroundColor: theme.primary },
        pressed && styles.pressionado,
      ]}>
      <Icone nome="adicionar" cor={theme.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titulo: {
    flex: 1,
    gap: Spacing.one,
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  acao: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionar: {
    borderRadius: 20,
  },
  pressionado: {
    opacity: 0.7,
  },
  inmetro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
