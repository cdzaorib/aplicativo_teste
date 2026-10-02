import { mesclarListas, type RegistroNuvem } from '../sincronizacao';
import type { ItemLista } from '../tipos';

function item(id: string, atualizadoEm: number, dados: Partial<ItemLista> = {}): ItemLista {
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
    ...dados,
  };
}

function registro(
  id: string,
  atualizadoEm: number,
  dados: Partial<RegistroNuvem> = {},
): RegistroNuvem {
  return { ...item(id, atualizadoEm), removido: false, ...dados };
}

const ids = (itens: { id: string }[]) => itens.map((i) => i.id).sort();

describe('mesclarListas', () => {
  it('envia tudo na primeira sincronização', () => {
    const { itens, enviar } = mesclarListas([item('a', 10), item('b', 10)], {}, []);
    expect(ids(itens)).toEqual(['a', 'b']);
    expect(enviar).toEqual([
      { ...item('a', 10), removido: false },
      { ...item('b', 10), removido: false },
    ]);
  });

  it('traz itens que só existem na nuvem', () => {
    const { itens, enviar } = mesclarListas([], {}, [registro('a', 10, { modelo: 'X' })]);
    expect(itens).toEqual([item('a', 10, { modelo: 'X' })]);
    expect(enviar).toEqual([]);
  });

  it('mantém a versão alterada por último', () => {
    const local = item('a', 20, { comprado: true });
    const nuvemMaisNova = registro('b', 30, { modelo: 'da nuvem' });
    const { itens, enviar } = mesclarListas([local, item('b', 10)], {}, [
      registro('a', 10),
      nuvemMaisNova,
    ]);

    expect(itens).toEqual([local, item('b', 30, { modelo: 'da nuvem' })]);
    expect(enviar).toEqual([{ ...local, removido: false }]);
  });

  it('em caso de empate fica com a nuvem e não envia nada', () => {
    const { itens, enviar } = mesclarListas([item('a', 10, { modelo: 'local' })], {}, [
      registro('a', 10, { modelo: 'nuvem' }),
    ]);
    expect(itens).toEqual([item('a', 10, { modelo: 'nuvem' })]);
    expect(enviar).toEqual([]);
  });

  it('remove do aparelho o que foi removido na nuvem depois da última alteração local', () => {
    const { itens, enviar } = mesclarListas([item('a', 10)], {}, [
      registro('a', 20, { removido: true }),
    ]);
    expect(itens).toEqual([]);
    expect(enviar).toEqual([]);
  });

  it('envia a remoção feita no aparelho', () => {
    const { itens, enviar } = mesclarListas([], { a: 30 }, [registro('a', 10)]);
    expect(itens).toEqual([]);
    expect(enviar).toEqual([{ ...registro('a', 10), removido: true, atualizadoEm: 30 }]);
  });

  it('mantém o item se ele foi alterado em outro aparelho depois da remoção', () => {
    const { itens, enviar } = mesclarListas([], { a: 30 }, [registro('a', 40, { comprado: true })]);
    expect(itens).toEqual([item('a', 40, { comprado: true })]);
    expect(enviar).toEqual([]);
  });

  it('ignora remoções de itens que nunca chegaram à nuvem ou já foram removidos lá', () => {
    const { itens, enviar } = mesclarListas([], { a: 30, b: 30 }, [
      registro('b', 20, { removido: true }),
    ]);
    expect(itens).toEqual([]);
    expect(enviar).toEqual([]);
  });

  it('ordena a lista pela data de criação', () => {
    const { itens } = mesclarListas([item('novo', 10, { criadoEm: 5 })], {}, [
      registro('antigo', 10, { criadoEm: 1 }),
    ]);
    expect(itens.map((i) => i.id)).toEqual(['antigo', 'novo']);
  });
});
