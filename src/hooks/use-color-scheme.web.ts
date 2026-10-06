import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { temaEscolhido, useAparenciaStore } from '@/store/aparencia';

const subscribe = () => () => {};

/**
 * Tema do app: o escolhido na aba Conta, ou o do navegador no automático. Na renderização estática
 * (no servidor) é sempre o claro; no navegador, é recalculado.
 */
export function useColorScheme() {
  // `true` no navegador, `false` na renderização estática no servidor.
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const aparencia = useAparenciaStore((s) => s.aparencia);
  const sistema = useRNColorScheme();

  return hasHydrated ? temaEscolhido(aparencia, sistema) : 'light';
}
