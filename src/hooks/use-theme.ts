/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type Paleta } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAparenciaStore } from '@/store/aparencia';

/** Cores do tema atual: claro, escuro ou preto (o escuro com fundo totalmente preto). */
export function useTheme(): Paleta {
  const scheme = useColorScheme();
  const preto = useAparenciaStore((s) => s.aparencia === 'preta');
  if (scheme !== 'dark') return Colors.light;
  return preto ? Colors.black : Colors.dark;
}
