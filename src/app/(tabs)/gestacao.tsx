import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/botao';
import { Icone } from '@/components/icone';
import { ProximaConsulta } from '@/components/proxima-consulta';
import { FormularioDataPrevista } from '@/components/quando-comprar';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  CONSULTAS_MINIMAS,
  curiosidadeDoMomento,
  FONTE_SINAIS_DE_ALERTA,
  lembretesDaSemana,
  ritmoDasConsultas,
  SINAIS_DE_ALERTA,
} from '@/domain/conteudo-gestacao';
import { faseDaGestacao, formatarData, tempoDeGestacao } from '@/domain/gestacao';
import { useInicioDoDia } from '@/hooks/use-inicio-do-dia';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useTheme } from '@/hooks/use-theme';
import { useGestacaoStore } from '@/store/gestacao';

const DIA_MS = 24 * 60 * 60 * 1000;

/** "1 dia", "3 dias". */
const quantos = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Aba Gestação: em que semana a gestação está, lembretes do pré-natal para a fase, sinais de
 * alerta e uma curiosidade. O app não é médico: tudo leva a fonte e manda conversar com a equipe.
 */
export default function GestacaoScreen() {
  const theme = useTheme();
  const insets = useScreenInsets();
  const dataPrevista = useGestacaoStore((s) => s.dataPrevista);
  const hoje = useInicioDoDia();
  const [editando, setEditando] = useState(false);

  const tempo = dataPrevista ? tempoDeGestacao(dataPrevista, new Date(hoje)) : undefined;
  const semanas = tempo?.semanas;
  const curiosidade = curiosidadeDoMomento(semanas, Math.floor(hoje / DIA_MS));
  // Sem data prevista, mostra o começo do pré-natal, que vale para quem está começando.
  const lembretes = lembretesDaSemana(semanas ?? 0);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.conteudo, insets]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <ThemedText type="subtitle">Gestação</ThemedText>

      <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
        <Icone nome="info" cor={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.expandir}>
          O app não é médico e não substitui o pré-natal. Vá a todas as consultas e use estas
          informações para conversar com a sua equipe de saúde, que sabe o que vale para você.
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        {tempo && dataPrevista && !editando ? (
          <Progresso
            semanas={tempo.semanas}
            dias={tempo.dias}
            diasParaAData={tempo.diasParaAData}
            dataPrevista={dataPrevista}
            onAlterar={() => setEditando(true)}
          />
        ) : (
          <FormularioDataPrevista
            titulo="Sua gestação"
            explicacao="Informe a data prevista do parto para acompanhar as semanas e ver os lembretes de cada fase."
            dataPrevista={dataPrevista}
            podeCancelar={editando}
            onConcluir={() => setEditando(false)}
          />
        )}
      </View>

      <ProximaConsulta />

      <View style={styles.secao}>
        <ThemedText type="smallBold" accessibilityRole="header">
          Pré-natal {semanas !== undefined ? 'nesta fase' : ''}
        </ThemedText>
        <Cartao>
          <ThemedText type="small">
            {semanas !== undefined ? `${ritmoDasConsultas(semanas)} ` : ''}
            {CONSULTAS_MINIMAS}
          </ThemedText>
          <Fonte texto="Ministério da Saúde" />
        </Cartao>
        {lembretes.map((lembrete) => (
          <Cartao key={lembrete.titulo}>
            <ThemedText type="smallBold">{lembrete.titulo}</ThemedText>
            <ThemedText type="small">{lembrete.texto}</ThemedText>
            <Fonte texto={lembrete.fonte} />
          </Cartao>
        ))}
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold" accessibilityRole="header">
          {semanas !== undefined ? 'Curiosidade da semana' : 'Curiosidade do dia'}
        </ThemedText>
        <Cartao>
          <ThemedText type="small">{curiosidade.texto}</ThemedText>
          <Fonte texto={curiosidade.fonte} />
        </Cartao>
      </View>

      <View style={styles.secao}>
        <ThemedText type="smallBold" accessibilityRole="header">
          Sinais de alerta
        </ThemedText>
        <View style={[styles.cartao, styles.alerta, { borderColor: theme.danger }]}>
          <View style={styles.linha}>
            <Icone nome="aviso" cor={theme.danger} />
            <ThemedText type="smallBold" style={[styles.expandir, { color: theme.danger }]}>
              Procure atendimento na hora, sem esperar a próxima consulta, se tiver:
            </ThemedText>
          </View>
          {SINAIS_DE_ALERTA.map((sinal) => (
            <ThemedText key={sinal} type="small">
              • {sinal}
            </ThemedText>
          ))}
          <ThemedText type="small">
            Em emergência, ligue <ThemedText type="smallBold">192 (SAMU)</ThemedText>.
          </ThemedText>
          <ThemedText type="small">
            Se tiver pensamentos de se machucar ou de machucar o bebê, peça ajuda: fale com a sua
            equipe ou ligue para o CVV no <ThemedText type="smallBold">188</ThemedText>, de graça,
            24 horas.
          </ThemedText>
          <Fonte texto={FONTE_SINAIS_DE_ALERTA} />
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Conteúdo em revisão por profissionais de saúde. Pesquisado em fontes oficiais em outubro de
        2026.
      </ThemedText>
    </ScrollView>
  );
}

function Progresso({
  semanas,
  dias,
  diasParaAData,
  dataPrevista,
  onAlterar,
}: {
  semanas: number;
  dias: number;
  diasParaAData: number;
  dataPrevista: string;
  onAlterar: () => void;
}) {
  const theme = useTheme();
  const progresso = Math.min(1, (semanas * 7 + dias) / 280);
  const faltam =
    diasParaAData > 0
      ? `Faltam ${quantos(Math.floor(diasParaAData / 7), 'semana', 'semanas')} e ${quantos(diasParaAData % 7, 'dia', 'dias')} para a data prevista.`
      : diasParaAData === 0
        ? 'Hoje é a data prevista do parto.'
        : `A data prevista passou há ${quantos(-diasParaAData, 'dia', 'dias')}.`;

  return (
    <>
      <ThemedText type="smallBold">
        {quantos(semanas, 'semana', 'semanas')} e {quantos(dias, 'dia', 'dias')} ·{' '}
        {faseDaGestacao(semanas)}
      </ThemedText>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Semanas de gestação"
        accessibilityValue={{ min: 0, max: 40, now: Math.min(semanas, 40) }}
        style={[styles.barra, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[
            styles.preenchimento,
            { backgroundColor: theme.primary, width: `${progresso * 100}%` },
          ]}
        />
      </View>
      <ThemedText type="small">{faltam}</ThemedText>
      <View style={styles.linha}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.expandir}>
          Data prevista: {formatarData(dataPrevista)}
        </ThemedText>
        <Botao titulo="Alterar" variante="secundario" onPress={onAlterar} />
      </View>
    </>
  );
}

function Cartao({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>{children}</View>
  );
}

function Fonte({ texto }: { texto: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      Fonte: {texto}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  aviso: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  secao: {
    gap: Spacing.two,
  },
  cartao: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  alerta: {
    borderWidth: 1,
    gap: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  expandir: {
    flex: 1,
  },
  barra: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: 4,
  },
});
