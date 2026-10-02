import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AvisoRevisao } from '@/components/aviso-revisao';
import { Botao } from '@/components/botao';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { entrarComGoogle, sair } from '@/nuvem/auth';
import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';
import { useSessaoStore } from '@/store/sessao';

export default function ContaScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, insets]}>
      <ThemedText type="subtitle">Conta</ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        {supabase ? (
          <CartaoNuvem />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            O login não está disponível nesta versão. A lista fica salva neste aparelho.
          </ThemedText>
        )}
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold">Sobre o conteúdo</ThemedText>
        <AvisoRevisao />
        <ThemedText type="small" themeColor="textSecondary">
          Os itens marcados como &quot;Evitar&quot; seguem recomendações de entidades oficiais,
          citadas em cada item.
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Versão {Constants.expoConfig?.version}
      </ThemedText>
    </ScrollView>
  );
}

function CartaoNuvem() {
  const theme = useTheme();
  const { usuario, sincronizando, ultimaSincronizacao, erroSincronizacao } = useSessaoStore();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();

  async function executar(acao: () => Promise<unknown>, mensagemErro: string) {
    setOcupado(true);
    setErro(undefined);
    try {
      await acao();
    } catch {
      setErro(mensagemErro);
    } finally {
      setOcupado(false);
    }
  }

  if (!usuario) {
    return (
      <>
        <ThemedText type="smallBold">Sua lista na nuvem</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Entre com sua conta Google para guardar a lista na nuvem e usar em outro celular. A lista
          que você já montou neste aparelho vai junto.
        </ThemedText>
        <Botao
          titulo={ocupado ? 'Entrando…' : 'Entrar com Google'}
          desabilitado={ocupado}
          onPress={() =>
            executar(entrarComGoogle, 'Não foi possível entrar. Tente de novo em instantes.')
          }
        />
        {erro && <ThemedText style={{ color: theme.danger }}>{erro}</ThemedText>}
      </>
    );
  }

  const status = sincronizando
    ? 'Sincronizando…'
    : (erroSincronizacao ??
      (ultimaSincronizacao
        ? `Lista salva na nuvem às ${new Date(ultimaSincronizacao).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : 'Aguardando a primeira sincronização'));

  return (
    <>
      <View style={styles.usuario}>
        <ThemedText type="smallBold">{usuario.nome ?? usuario.email}</ThemedText>
        {usuario.nome && usuario.email && (
          <ThemedText type="small" themeColor="textSecondary">
            {usuario.email}
          </ThemedText>
        )}
      </View>
      <ThemedText
        type="small"
        style={erroSincronizacao && !sincronizando ? { color: theme.danger } : undefined}
        themeColor="textSecondary">
        {status}
      </ThemedText>
      <Botao
        titulo="Sincronizar agora"
        variante="secundario"
        desabilitado={ocupado || sincronizando}
        onPress={() => executar(sincronizar, 'Não foi possível sincronizar agora.')}
      />
      <Botao
        titulo={ocupado ? 'Saindo…' : 'Sair'}
        variante="perigo"
        desabilitado={ocupado}
        onPress={() =>
          executar(
            sair,
            'Não foi possível salvar sua lista na nuvem antes de sair. Verifique a internet e tente de novo.',
          )
        }
      />
      {erro && <ThemedText style={{ color: theme.danger }}>{erro}</ThemedText>}
    </>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  secao: {
    gap: Spacing.two,
  },
  usuario: {
    gap: Spacing.half,
  },
});
