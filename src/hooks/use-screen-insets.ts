import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';

/** Espaçamento do conteúdo de uma tela de aba, respeitando a área segura e a barra de abas. */
export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + Spacing.three,
    paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
    paddingLeft: insets.left + Spacing.three,
    paddingRight: insets.right + Spacing.three,
  };
}
