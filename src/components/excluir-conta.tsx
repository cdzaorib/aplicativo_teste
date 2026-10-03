import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { confirmar } from '@/components/confirmar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { excluirConta } from '@/nuvem/auth';

/** Seção da tela Conta para excluir a conta e os dados dela (exigência das lojas). */
export function ExcluirConta() {
  const theme = useTheme();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();

  async function excluir() {
    const confirmado = await confirmar(
      'Excluir minha conta',
      'Sua conta, sua lista (na nuvem e neste aparelho), os dados da gestação e os preços que você informou serão apagados. Se você convidou pessoas, elas voltam para as próprias listas. Não dá para desfazer.',
      'Excluir',
    );
    if (!confirmado) return;
    setOcupado(true);
    setErro(undefined);
    try {
      await excluirConta();
    } catch {
      setErro('Não foi possível excluir a conta. Verifique a internet e tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.secao}>
      <ThemedText type="smallBold">Excluir conta</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Apaga a sua conta e todos os dados dela: a lista e os preços que você informou.
      </ThemedText>
      <Botao
        titulo={ocupado ? 'Excluindo…' : 'Excluir minha conta'}
        variante="perigo"
        desabilitado={ocupado}
        onPress={excluir}
      />
      {erro && (
        <ThemedText accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
          {erro}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: Spacing.two,
  },
});
