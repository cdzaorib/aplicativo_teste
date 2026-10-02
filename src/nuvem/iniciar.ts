import { AppState, Platform } from 'react-native';

import { atualizarReferencias } from '@/nuvem/precos';
import { sincronizar } from '@/nuvem/sincronizar';
import { supabase } from '@/nuvem/supabase';
import { useListaStore } from '@/store/lista';
import { useReferenciasStore } from '@/store/referencias';
import { useSessaoStore } from '@/store/sessao';

/** Espera depois da última alteração antes de sincronizar, para juntar alterações seguidas. */
const ESPERA_ALTERACOES_MS = 2000;

// O erro já fica registrado em useSessaoStore e aparece na tela Conta.
const sincronizarEmSegundoPlano = () => sincronizar().catch(() => {});
// Sem as referências novas, o app usa as que já tem guardadas (ou a faixa pesquisada).
const atualizarReferenciasEmSegundoPlano = () => atualizarReferencias().catch(() => {});

/**
 * Liga a sessão do Supabase ao app: acompanha login e logout e sincroniza a lista ao entrar,
 * ao voltar para o app e depois de cada alteração. Também mantém as referências de preço em dia.
 * Chame depois de carregar a lista do aparelho. Retorna a função que desliga tudo.
 */
export function iniciarNuvem(): () => void {
  if (!supabase) return () => {};
  const cliente = supabase;

  useReferenciasStore.persist.rehydrate()?.then(atualizarReferenciasEmSegundoPlano);

  const {
    data: { subscription },
  } = cliente.auth.onAuthStateChange((evento, sessao) => {
    const usuario = sessao?.user;
    useSessaoStore.setState({
      usuario: usuario
        ? { id: usuario.id, nome: usuario.user_metadata?.full_name, email: usuario.email }
        : null,
      ...(!usuario && { lista: undefined }),
    });
    if (usuario && (evento === 'INITIAL_SESSION' || evento === 'SIGNED_IN')) {
      // Chamar o Supabase dentro deste callback pode travar; por isso o setTimeout.
      setTimeout(sincronizarEmSegundoPlano, 0);
    }
  });

  // No celular, o token só é renovado com o app aberto (recomendação do Supabase).
  const assinaturaApp = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      if (Platform.OS !== 'web') cliente.auth.startAutoRefresh();
      sincronizarEmSegundoPlano();
      atualizarReferenciasEmSegundoPlano();
    } else if (Platform.OS !== 'web') {
      cliente.auth.stopAutoRefresh();
    }
  });

  let espera: ReturnType<typeof setTimeout> | undefined;
  const cancelarLista = useListaStore.subscribe((estado, anterior) => {
    if (estado.versaoLocal === anterior.versaoLocal) return;
    clearTimeout(espera);
    espera = setTimeout(sincronizarEmSegundoPlano, ESPERA_ALTERACOES_MS);
  });

  return () => {
    subscription.unsubscribe();
    assinaturaApp.remove();
    cancelarLista();
    clearTimeout(espera);
  };
}
