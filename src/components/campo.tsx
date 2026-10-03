import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CampoProps = TextInputProps & {
  rotulo: string;
  erro?: string;
};

export function Campo({ rotulo, erro, style, ...props }: CampoProps) {
  const theme = useTheme();
  return (
    <View style={styles.campo}>
      <ThemedText type="smallBold">{rotulo}</ThemedText>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: erro ? theme.danger : theme.border,
          },
          props.editable === false && styles.bloqueado,
          style,
        ]}
        {...props}
      />
      {erro ? (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
          {erro}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: Spacing.one,
  },
  bloqueado: {
    opacity: 0.6,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    fontSize: 16,
  },
});
