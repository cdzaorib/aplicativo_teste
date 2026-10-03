import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { EMAIL_CONTATO } from '@/constants/app';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Página de texto longo (política de privacidade, exclusão de conta), boa no celular e na web. */
export function PaginaTexto({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.conteudo}>
      {children}
    </ScrollView>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.secao}>
      <ThemedText type="smallBold" accessibilityRole="header">
        {titulo}
      </ThemedText>
      {children}
    </View>
  );
}

export function Paragrafo({ children }: { children: ReactNode }) {
  return <ThemedText type="small">{children}</ThemedText>;
}

/** Item de lista com marcador, para enumerar dados e direitos. */
export function Topico({ children }: { children: ReactNode }) {
  return (
    <View style={styles.topico}>
      <ThemedText type="small">•</ThemedText>
      <ThemedText type="small" style={styles.expandir}>
        {children}
      </ThemedText>
    </View>
  );
}

/** O e-mail de contato, ou um aviso enquanto ele não foi definido. */
export function textoContato(): string {
  return EMAIL_CONTATO ?? 'e-mail de contato a definir';
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  secao: {
    gap: Spacing.two,
  },
  topico: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  expandir: {
    flex: 1,
  },
});
