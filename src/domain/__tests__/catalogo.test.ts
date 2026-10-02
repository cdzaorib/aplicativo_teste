import { CATALOGO } from '../catalogo';
import { CATEGORIAS, PRIORIDADES, QUANDO } from '../tipos';

describe('catálogo', () => {
  it('tem ids únicos', () => {
    const ids = CATALOGO.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('usa apenas categorias, prioridades e momentos conhecidos', () => {
    for (const item of CATALOGO) {
      expect(CATEGORIAS).toHaveProperty(item.categoria);
      expect(PRIORIDADES).toHaveProperty(item.prioridade);
      expect(QUANDO).toHaveProperty(item.quando);
    }
  });

  it('exige fonte oficial em todo item "evitar"', () => {
    const semFonte = CATALOGO.filter((item) => item.prioridade === 'evitar' && !item.fonte);
    expect(semFonte.map((item) => item.id)).toEqual([]);
  });

  it('sugere quantidade apenas para itens que devem ser comprados', () => {
    for (const item of CATALOGO) {
      if (item.prioridade === 'evitar') expect(item.quantidade).toBe(0);
      else expect(item.quantidade).toBeGreaterThan(0);
    }
  });

  it('preenche nome, motivo e termo de busca', () => {
    for (const item of CATALOGO) {
      expect(item.nome.trim()).not.toBe('');
      expect(item.porque.trim()).not.toBe('');
      expect(item.busca.trim()).not.toBe('');
    }
  });
});
