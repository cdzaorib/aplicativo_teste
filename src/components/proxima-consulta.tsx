import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Campo } from '@/components/campo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { consultaPassou, formatarConsulta, lerConsulta, mascararHora } from '@/domain/consulta';
import { mascararData } from '@/domain/gestacao';
import { useTheme } from '@/hooks/use-theme';
import {
  agendarAvisosDaConsulta,
  cancelarAvisosDaConsulta,
  LEMBRETES_DISPONIVEIS,
  pedirPermissaoDeAvisos,
} from '@/notificacoes/lembretes';
import { useGestacaoStore } from '@/store/gestacao';

/**
 * Próxima consulta de pré-natal, com avisos na véspera e 2 horas antes, e as perguntas para
 * levar. Tudo fica só no aparelho.
 */
export function ProximaConsulta() {
  const theme = useTheme();
  const proximaConsulta = useGestacaoStore((s) => s.proximaConsulta);
  const perguntas = useGestacaoStore((s) => s.perguntasConsulta);
  const { definirProximaConsulta, definirPerguntasConsulta } = useGestacaoStore.getState();
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<string>();

  const marcada = proximaConsulta !== undefined && !consultaPassou(proximaConsulta);

  async function salvar(quando: string) {
    definirProximaConsulta(quando);
    setEditando(false);
    setAviso(undefined);
    if (!LEMBRETES_DISPONIVEIS) return;
    if (await pedirPermissaoDeAvisos()) {
      await agendarAvisosDaConsulta(quando).catch(() => {});
    } else {
      // Os avisos da data anterior não podem tocar se a permissão voltar depois.
      cancelarAvisosDaConsulta().catch(() => {});
      setAviso('Para receber os avisos, permita as notificações do app nos ajustes do celular.');
    }
  }

  function apagar() {
    definirProximaConsulta(undefined);
    cancelarAvisosDaConsulta().catch(() => {});
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">Próxima consulta</ThemedText>

      {marcada && !editando ? (
        <>
          <ThemedText>{formatarConsulta(proximaConsulta)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {LEMBRETES_DISPONIVEIS
              ? 'Você recebe um aviso na véspera, às 19h, e outro 2 horas antes.'
              : 'Os avisos aparecem no app instalado no celular.'}
          </ThemedText>
          <View style={styles.botoes}>
            <Botao titulo="Alterar" variante="secundario" onPress={() => setEditando(true)} />
            <Botao titulo="Apagar" variante="perigo" onPress={apagar} />
          </View>
        </>
      ) : (
        <FormularioConsulta
          passou={proximaConsulta !== undefined && !editando}
          podeCancelar={editando}
          onSalvar={salvar}
          onCancelar={() => setEditando(false)}
        />
      )}

      {aviso ? (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
          {aviso}
        </ThemedText>
      ) : null}

      <Campo
        rotulo="Perguntas para levar"
        placeholder="Ex.: Posso continuar com a academia? Quando faço o ultrassom?"
        value={perguntas}
        onChangeText={definirPerguntasConsulta}
        multiline
        maxLength={1000}
        style={styles.perguntas}
      />
    </View>
  );
}

function FormularioConsulta({
  passou,
  podeCancelar,
  onSalvar,
  onCancelar,
}: {
  passou: boolean;
  podeCancelar: boolean;
  onSalvar: (quando: string) => void;
  onCancelar: () => void;
}) {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [erro, setErro] = useState<string>();

  function salvar() {
    const leitura = lerConsulta(data, hora);
    if ('erro' in leitura) {
      setErro(leitura.erro);
      return;
    }
    onSalvar(leitura.quando);
  }

  return (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        {passou
          ? 'A última consulta já passou. Marque a próxima para receber os avisos.'
          : 'Anote a data da próxima consulta para receber um aviso na véspera e no dia.'}
      </ThemedText>
      <View style={styles.campos}>
        <View style={styles.expandir}>
          <Campo
            rotulo="Data da consulta"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            value={data}
            onChangeText={(valor) => {
              setData(mascararData(valor));
              setErro(undefined);
            }}
          />
        </View>
        <View style={styles.hora}>
          <Campo
            rotulo="Hora"
            placeholder="HH:MM"
            keyboardType="number-pad"
            maxLength={5}
            value={hora}
            onChangeText={(valor) => {
              setHora(mascararHora(valor));
              setErro(undefined);
            }}
          />
        </View>
      </View>
      {erro ? <ErroCampo texto={erro} /> : null}
      <Botao
        titulo="Salvar consulta"
        onPress={salvar}
        desabilitado={data.length < 10 || hora.length < 5}
      />
      {podeCancelar && <Botao titulo="Cancelar" variante="secundario" onPress={onCancelar} />}
    </>
  );
}

function ErroCampo({ texto }: { texto: string }) {
  const theme = useTheme();
  return (
    <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
      {texto}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  botoes: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  campos: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  expandir: {
    flex: 1,
  },
  hora: {
    width: 110,
  },
  perguntas: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
