import { useColorScheme as useRNColorScheme } from 'react-native';

import { temaEscolhido, useAparenciaStore } from '@/store/aparencia';

/** Tema do app: o escolhido na aba Conta, ou o do celular no automático. */
export function useColorScheme() {
  const aparencia = useAparenciaStore((s) => s.aparencia);
  return temaEscolhido(aparencia, useRNColorScheme());
}
