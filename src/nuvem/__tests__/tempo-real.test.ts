import type { SupabaseClient } from '@supabase/supabase-js';

import type { ItemLista } from '@/domain/tipos';
import type { LinhaItem } from '@/nuvem/linhas';
import { useListaStore } from '@/store/lista';
import { useSessaoStore } from '@/store/sessao';
import { acompanharLista } from '../tempo-real';

type Filtro = { table: string; filter: string };
type Aviso = (mudanca: { new: object }) => void;
type CanalFalso = {
  on: jest.Mock<CanalFalso, [string, Filtro, Aviso]>;
  subscribe: jest.Mock<CanalFalso, []>;
};

/** Cliente do Supabase falso, que guarda quem escuta o quê e permite simular os avisos. */
function clienteFalso() {
  const ouvintes: { filtro: Filtro; callback: Aviso }[] = [];
  const canal: CanalFalso = {
    on: jest.fn((_tipo: string, filtro: Filtro, callback: Aviso) => {
      ouvintes.push({ filtro, callback });
      return canal;
    }),
    subscribe: jest.fn(() => canal),
  };
  const cliente = {
    channel: jest.fn(() => canal),
    removeChannel: jest.fn(() => Promise.resolve('ok')),
  };
  function avisar(table: string, filter: string, linhaNova: object) {
    ouvintes
      .filter((o) => o.filtro.table === table && o.filtro.filter === filter)
      .forEach((o) => o.callback({ new: linhaNova }));
  }
  return { cliente, canal, avisar };
}

function item(id: string, atualizadoEm: number): ItemLista {
  return {
    id,
    nome: `Item ${id}`,
    categoria: 'quarto',
    prioridade: 'util',
    modelo: '',
    quantidade: 1,
    comprado: false,
    criadoEm: 1,
    atualizadoEm,
  };
}

function linha(id: string, atualizadoEm: number, dados: Partial<LinhaItem> = {}): LinhaItem {
  return {
    lista_id: 'lista-1',
    id,
    catalogo_id: null,
    nome: `Item ${id}`,
    categoria: 'quarto',
    prioridade: 'util',
    modelo: '',
    preco_centavos: null,
    quantidade: 1,
    comprado: false,
    removido: false,
    comprado_por: null,
    criado_em: new Date(1).toISOString(),
    atualizado_em: new Date(atualizadoEm).toISOString(),
    ...dados,
  };
}

beforeEach(() => {
  useListaStore.setState({ itens: [item('a', 1000)], removidos: {} });
  useSessaoStore.setState({ mudancasMembros: 0, mudancasPresentes: 0 });
});

describe('acompanharLista', () => {
  it('escuta só a lista atual e a própria participação', () => {
    const { cliente, canal } = clienteFalso();
    acompanharLista(cliente as unknown as SupabaseClient, 'lista-1', 'eu', jest.fn());
    expect(canal.on.mock.calls.map(([, filtro]) => [filtro.table, filtro.filter])).toEqual([
      ['itens', 'lista_id=eq.lista-1'],
      ['membros_lista', 'user_id=eq.eu'],
      ['membros_lista', 'lista_id=eq.lista-1'],
      ['presentes', 'lista_id=eq.lista-1'],
    ]);
    expect(canal.subscribe).toHaveBeenCalled();
  });

  it('sincroniza quando outra pessoa muda um item, mas não com o eco do próprio aparelho', () => {
    const { cliente, avisar } = clienteFalso();
    const aoMudar = jest.fn();
    acompanharLista(cliente as unknown as SupabaseClient, 'lista-1', 'eu', aoMudar);

    avisar('itens', 'lista_id=eq.lista-1', linha('a', 1000));
    expect(aoMudar).not.toHaveBeenCalled();

    avisar('itens', 'lista_id=eq.lista-1', linha('a', 2000, { comprado: true }));
    avisar('itens', 'lista_id=eq.lista-1', linha('novo', 2000));
    expect(aoMudar).toHaveBeenCalledTimes(2);
  });

  it('sincroniza quando a dona muda a permissão e avisa a tela quando alguém entra', () => {
    const { cliente, avisar } = clienteFalso();
    const aoMudar = jest.fn();
    acompanharLista(cliente as unknown as SupabaseClient, 'lista-1', 'eu', aoMudar);

    avisar('membros_lista', 'user_id=eq.eu', { user_id: 'eu', pode_editar_lista: true });
    expect(aoMudar).toHaveBeenCalledTimes(1);

    avisar('membros_lista', 'lista_id=eq.lista-1', { user_id: 'convidado' });
    expect(useSessaoStore.getState().mudancasMembros).toBe(1);

    avisar('presentes', 'lista_id=eq.lista-1', { item_id: 'banheira' });
    expect(useSessaoStore.getState().mudancasPresentes).toBe(1);
  });

  it('para de escutar e usa um canal novo a cada vez', () => {
    const { cliente } = clienteFalso();
    const parar = acompanharLista(cliente as unknown as SupabaseClient, 'lista-1', 'eu', jest.fn());
    acompanharLista(cliente as unknown as SupabaseClient, 'lista-1', 'eu', jest.fn());
    parar();
    expect(cliente.removeChannel).toHaveBeenCalledTimes(1);
    const [[primeiro], [segundo]] = cliente.channel.mock.calls as unknown as [string][];
    expect(primeiro).not.toBe(segundo);
  });
});
