import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipsProps<T extends string> = {
  opcoes: Record<T, string>;
  valor: T | undefined;
  onChange: (valor: T) => void;
  rotulo: string;
  desabilitado?: boolean;
};

/** Linha horizontal de opções em que apenas uma fica selecionada. */
export function Chips<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  desabilitado,
}: ChipsProps<T>) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={rotulo}
      contentContainerStyle={styles.linha}>
      {(Object.keys(opcoes) as T[]).map((chave) => {
        const selecionado = chave === valor;
        return (
          <Pressable
            key={chave}
            accessibilityRole="button"
            accessibilityState={{ selected: selecionado, disabled: desabilitado }}
            disabled={desabilitado}
            // Os chips são baixos; a área de toque chega a 44 pontos sem mudar o visual.
            hitSlop={{ top: 6, bottom: 6 }}
            onPress={() => onChange(chave)}
            style={[
              styles.chip,
              { borderColor: theme.border },
              selecionado && { backgroundColor: theme.primary, borderColor: theme.primary },
              desabilitado && !selecionado && styles.esmaecido,
            ]}>
            <Text style={[styles.texto, { color: selecionado ? theme.onPrimary : theme.text }]}>
              {opcoes[chave]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  linha: {
    gap: Spacing.two,
  },
  esmaecido: {
    opacity: 0.5,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  texto: {
    fontSize: 14,
    fontWeight: 600,
  },
});
