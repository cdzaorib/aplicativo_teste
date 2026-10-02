import { create } from 'zustand';

export type Usuario = {
  id: string;
  nome?: string;
  email?: string;
};

type SessaoState = {
  usuario: Usuario | null;
  sincronizando: boolean;
  ultimaSincronizacao?: number;
  erroSincronizacao?: string;
};

/** Usuário conectado e estado da sincronização com a nuvem. */
export const useSessaoStore = create<SessaoState>()(() => ({
  usuario: null,
  sincronizando: false,
}));
