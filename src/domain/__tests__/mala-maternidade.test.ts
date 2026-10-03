import {
  itensProntos,
  prazoDaMala,
  SECOES_MALA,
  TOTAL_ITENS_MALA,
} from '@/domain/mala-maternidade';

describe('mala da maternidade', () => {
  it('cada item tem um id único e cada seção cita a fonte', () => {
    const ids = SECOES_MALA.flatMap((secao) => secao.itens.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(TOTAL_ITENS_MALA);
    for (const secao of SECOES_MALA) {
      expect(secao.fonte).not.toBe('');
      expect(secao.itens.length).toBeGreaterThan(0);
    }
  });

  it('conta só os itens que existem na lista', () => {
    expect(itensProntos([])).toBe(0);
    expect(itensProntos(['doc-caderneta', 'bebe-touca'])).toBe(2);
    // Um item que saiu da lista numa versão nova do app não conta.
    expect(itensProntos(['doc-caderneta', 'item-antigo'])).toBe(1);
  });

  it('o prazo é 3 semanas antes da data prevista, virando o mês e o ano', () => {
    expect(prazoDaMala('2027-03-30')).toBe('2027-03-09');
    expect(prazoDaMala('2027-03-10')).toBe('2027-02-17');
    expect(prazoDaMala('2027-01-10')).toBe('2026-12-20');
  });
});
