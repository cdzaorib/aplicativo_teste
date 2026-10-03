import { create } from 'zustand';

import type { Permissao } from '@/domain/sincronizacao';

export type Usuario = {
  id: string;
  nome?: string;
  email?: string;
};

/** A lista em que a pessoa está agora (a própria ou uma compartilhada) e o que ela pode fazer. */
export type InfoLista = {
  id: string;
  souDona: boolean;
  podeEditarLista: boolean;
  podeEditarPrecos: boolean;
  /** Só a dona vê o código de convite. */
  codigoConvite?: string;
  nomeDona?: string;
};

type SessaoState = {
  usuario: Usuario | null;
  lista?: InfoLista;
  sincronizando: boolean;
  ultimaSincronizacao?: number;
  erroSincronizacao?: string;
  /** Aumenta quando alguém entra na lista ou muda de permissão (aviso em tempo real). */
  mudancasMembros: number;
};

/** Usuário conectado, lista atual e estado da sincronização com a nuvem. */
export const useSessaoStore = create<SessaoState>()(() => ({
  usuario: null,
  sincronizando: false,
  mudancasMembros: 0,
}));

/** Sem conta ou na própria lista, a pessoa pode tudo; numa lista compartilhada, o que a dona deixar. */
export function permissaoNaLista(lista: InfoLista | undefined): Permissao {
  if (!lista || lista.podeEditarLista) return 'total';
  return lista.podeEditarPrecos ? 'precos' : 'leitura';
}

export function usePermissao(): Permissao {
  return useSessaoStore((s) => permissaoNaLista(s.usuario ? s.lista : undefined));
}
