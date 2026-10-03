import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

/** Meia-noite de hoje no relógio do aparelho (muda só quando o dia muda). */
function inicioDoDia(): number {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return agora.getTime();
}

function assinar(avisar: () => void): () => void {
  // Ao voltar para o app, confere se o dia mudou enquanto ele estava em segundo plano.
  const assinatura = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') avisar();
  });
  return () => assinatura.remove();
}

/**
 * Hoje (meia-noite local), atualizado quando a pessoa volta para o app num outro dia. Serve para
 * contas que dependem da data, como as semanas de gestação, não ficarem paradas com o app aberto.
 */
export function useInicioDoDia(): number {
  return useSyncExternalStore(assinar, inicioDoDia, inicioDoDia);
}
