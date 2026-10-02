import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipsProps<T extends string> = {
  opcoes: Record<T, string>;
  valor: T | undefined;
  onChange: (valor: T) => void;
  rotulo: string;
};

/** Linha horizontal de opções em que apenas uma fica selecionada. */
export function Chips<T extends string>({ opcoes, valor, onChange, rotulo }: ChipsProps<T>) {
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
            accessibilityState={{ selected: selecionado }}
            onPress={() => onChange(chave)}
            style={[
              styles.chip,
              { borderColor: theme.border },
              selecionado && { backgroundColor: theme.primary, borderColor: theme.primary },
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
