import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  faseDaGestacao,
  formatarData,
  itensParaComprarAgora,
  lerDataPrevista,
  mascararData,
  semanasDeGestacao,
} from '@/domain/gestacao';
import type { ItemLista } from '@/domain/tipos';
import { useTheme } from '@/hooks/use-theme';
import {
  agendarLembretes,
  cancelarLembretes,
  LEMBRETES_DISPONIVEIS,
  pedirPermissaoDeAvisos,
} from '@/notificacoes/lembretes';
import { useGestacaoStore, useSemanasDeGestacao } from '@/store/gestacao';

/** Cartão da lista que mostra a fase da gestação e quantos itens já é hora de comprar. */
export function QuandoComprar({ itens }: { itens: ItemLista[] }) {
  const theme = useTheme();
  const dataPrevista = useGestacaoStore((s) => s.dataPrevista);
  const [editando, setEditando] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      {dataPrevista && !editando ? (
        <Resumo dataPrevista={dataPrevista} itens={itens} onAlterar={() => setEditando(true)} />
      ) : (
        <Formulario
          dataPrevista={dataPrevista}
          onConcluir={() => setEditando(false)}
          podeCancelar={editando}
        />
      )}
    </View>
  );
}

function Resumo({
  dataPrevista,
  itens,
  onAlterar,
}: {
  dataPrevista: string;
  itens: ItemLista[];
  onAlterar: () => void;
}) {
  const semanas = useSemanasDeGestacao() ?? semanasDeGestacao(dataPrevista);
  const agora = itensParaComprarAgora(itens, semanas).length;

  return (
    <>
      <ThemedText type="smallBold">
        {semanas >= 40
          ? 'A data prevista do parto chegou'
          : `${semanas} semanas · ${faseDaGestacao(semanas)}`}
      </ThemedText>
      <ThemedText type="small">
        {agora === 0
          ? 'Nada pendente para esta fase.'
          : agora === 1
            ? '1 item para comprar agora, marcado com "Hora de comprar".'
            : `${agora} itens para comprar agora, marcados com "Hora de comprar".`}
      </ThemedText>
      <View style={styles.linha}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.expandir}>
          Data prevista: {formatarData(dataPrevista)}
        </ThemedText>
        <Botao titulo="Alterar" variante="secundario" onPress={onAlterar} />
      </View>
      {LEMBRETES_DISPONIVEIS && <Lembretes dataPrevista={dataPrevista} />}
    </>
  );
}

/** Liga ou desliga os avisos no começo de cada fase, agendados no próprio aparelho. */
function Lembretes({ dataPrevista }: { dataPrevista: string }) {
  const theme = useTheme();
  const lembretes = useGestacaoStore((s) => s.lembretes);
  const definirLembretes = useGestacaoStore((s) => s.definirLembretes);
  const [aviso, setAviso] = useState<string>();

  async function alternar(ligar: boolean) {
    setAviso(undefined);
    try {
      if (!ligar) {
        await cancelarLembretes();
        definirLembretes(false);
        return;
      }
      if (!(await pedirPermissaoDeAvisos())) {
        setAviso('Para receber os avisos, permita as notificações do app nos ajustes do celular.');
        return;
      }
      await agendarLembretes(dataPrevista);
      definirLembretes(true);
    } catch {
      setAviso('Não foi possível mudar os avisos agora. Tente de novo.');
    }
  }

  return (
    <>
      <View style={styles.linha}>
        <ThemedText type="small" style={styles.expandir}>
          Avisar quando começar cada fase de compras
        </ThemedText>
        <Switch
          accessibilityLabel="Avisar quando começar cada fase de compras"
          value={lembretes}
          onValueChange={alternar}
          trackColor={{ true: theme.primary }}
        />
      </View>
      {aviso && (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
          {aviso}
        </ThemedText>
      )}
    </>
  );
}

function Formulario({
  dataPrevista,
  podeCancelar,
  onConcluir,
}: {
  dataPrevista?: string;
  podeCancelar: boolean;
  onConcluir: () => void;
}) {
  const definirDataPrevista = useGestacaoStore((s) => s.definirDataPrevista);
  const lembretes = useGestacaoStore((s) => s.lembretes);
  const [texto, setTexto] = useState(dataPrevista ? formatarData(dataPrevista) : '');
  const [erro, setErro] = useState<string>();

  function salvar() {
    const leitura = lerDataPrevista(texto);
    if ('erro' in leitura) {
      setErro(leitura.erro);
      return;
    }
    definirDataPrevista(leitura.data);
    // Com outra data, os avisos mudam de dia. Se não der para reagendar, a lista segue igual.
    if (lembretes) agendarLembretes(leitura.data).catch(() => {});
    onConcluir();
  }

  return (
    <>
      <ThemedText type="smallBold">Quando comprar</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Informe a data prevista do parto para ver o que comprar em cada fase. A data fica só neste
        aparelho: não vai para a nuvem nem para a lista compartilhada.
      </ThemedText>
      <Campo
        rotulo="Data prevista do parto"
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
        value={texto}
        onChangeText={(valor) => {
          setTexto(mascararData(valor));
          setErro(undefined);
        }}
        erro={erro}
      />
      <Botao titulo="Salvar data" onPress={salvar} desabilitado={texto.length < 10} />
      {podeCancelar && (
        <>
          <Botao titulo="Cancelar" variante="secundario" onPress={onConcluir} />
          <Botao
            titulo="Apagar data"
            variante="perigo"
            onPress={() => {
              definirDataPrevista(undefined);
              cancelarLembretes().catch(() => {});
              onConcluir();
            }}
          />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  expandir: {
    flex: 1,
  },
});
