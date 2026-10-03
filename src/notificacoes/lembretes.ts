import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { avisosDaConsulta } from '@/domain/consulta';
import { lembretesDasFases } from '@/domain/gestacao';

type ModuloNotificacoes = typeof import('expo-notifications');

/**
 * Os avisos são agendados no próprio aparelho. Não existem na web nem no Expo Go do Android:
 * lá o `expo-notifications` dá erro só de ser carregado, porque o push foi removido do Expo Go
 * no SDK 53. No iPhone (inclusive no Expo Go) e no app instalado, funcionam.
 */
export const LEMBRETES_DISPONIVEIS =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isRunningInExpoGo());

const PREFIXO = 'fase-';
const PREFIXO_CONSULTA = 'consulta-';
const CANAL_ANDROID = 'lembretes';
const CANAL_CONSULTAS = 'consultas';

let carregado: Promise<ModuloNotificacoes> | undefined;

/** Carrega o módulo só quando é usado, para não quebrar onde ele não funciona (ver acima). */
function notificacoes(): Promise<ModuloNotificacoes> {
  carregado ??= import('expo-notifications').then((modulo) => {
    // Com o app aberto, o aviso também aparece (sem som).
    modulo.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    return modulo;
  });
  return carregado;
}

/**
 * Prepara a exibição dos avisos com o app aberto. Chame ao abrir o app quando a pessoa tiver
 * ligado os avisos.
 */
export async function prepararLembretes(): Promise<void> {
  if (LEMBRETES_DISPONIVEIS) await notificacoes();
}

/** Pede permissão para avisar, se ainda não tiver. Retorna se pode avisar. */
export async function pedirPermissaoDeAvisos(): Promise<boolean> {
  if (!LEMBRETES_DISPONIVEIS) return false;
  const Notifications = await notificacoes();
  if ((await Notifications.getPermissionsAsync()).granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function cancelarComPrefixo(prefixo: string): Promise<void> {
  if (!LEMBRETES_DISPONIVEIS) return;
  const Notifications = await notificacoes();
  const agendados = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendados
      .filter((aviso) => aviso.identifier.startsWith(prefixo))
      .map((aviso) => Notifications.cancelScheduledNotificationAsync(aviso.identifier)),
  );
}

/** Cancela os avisos de fase agendados por este app. */
export function cancelarLembretes(): Promise<void> {
  return cancelarComPrefixo(PREFIXO);
}

/** Cancela os avisos da consulta de pré-natal. */
export function cancelarAvisosDaConsulta(): Promise<void> {
  return cancelarComPrefixo(PREFIXO_CONSULTA);
}

/**
 * Agenda os avisos da consulta (na véspera e 2 horas antes), trocando os que estavam agendados.
 * Retorna quantos ficaram agendados.
 */
export async function agendarAvisosDaConsulta(quando: string): Promise<number> {
  if (!LEMBRETES_DISPONIVEIS) return 0;
  const Notifications = await notificacoes();
  await cancelarAvisosDaConsulta();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_CONSULTAS, {
      name: 'Consultas de pré-natal',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const avisos = avisosDaConsulta(quando);
  for (const aviso of avisos) {
    await Notifications.scheduleNotificationAsync({
      identifier: aviso.id,
      content: { title: aviso.titulo, body: aviso.corpo },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: aviso.data,
        channelId: CANAL_CONSULTAS,
      },
    });
  }
  return avisos.length;
}

/**
 * Agenda um aviso para o começo de cada fase de compras que ainda não chegou, trocando os que
 * estavam agendados. Tudo fica no aparelho: a data prevista do parto não sai dele.
 * Retorna quantos avisos ficaram agendados.
 */
export async function agendarLembretes(dataPrevista: string): Promise<number> {
  if (!LEMBRETES_DISPONIVEIS) return 0;
  const Notifications = await notificacoes();
  await cancelarLembretes();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Fases de compra do enxoval',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const lembretes = lembretesDasFases(dataPrevista);
  for (const lembrete of lembretes) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIXO}${lembrete.quando}`,
      content: { title: lembrete.titulo, body: lembrete.corpo },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: lembrete.data,
        channelId: CANAL_ANDROID,
      },
    });
  }
  return lembretes.length;
}
