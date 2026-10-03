import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Vibração curta ao marcar ou desmarcar um item (comprado na lista, pronto na mala). No Android
 * usa o retorno tátil do sistema (não pede permissão de vibração); na web, ou sem suporte no
 * aparelho, não faz nada.
 */
export function vibrarAoMarcar(marcado: boolean): void {
  const vibracao =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(
          marcado ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off,
        )
      : Platform.OS === 'ios'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : undefined;
  vibracao?.catch(() => {});
}
