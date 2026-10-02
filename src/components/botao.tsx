import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  desabilitado?: boolean;
};

export function Botao({ titulo, onPress, variante = 'primario', desabilitado }: BotaoProps) {
  const theme = useTheme();
  const cores = {
    primario: { fundo: theme.primary, texto: theme.onPrimary },
    secundario: { fundo: theme.backgroundElement, texto: theme.text },
    perigo: { fundo: theme.backgroundElement, texto: theme.danger },
  }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: cores.fundo },
        (pressed || desabilitado) && styles.esmaecido,
      ]}>
      <Text style={[styles.texto, { color: cores.texto }]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontSize: 16,
    fontWeight: 600,
  },
  esmaecido: {
    opacity: 0.6,
  },
});
