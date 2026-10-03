import { resumirHistorico } from '../historico';

describe('resumirHistorico', () => {
  it('acha o menor preço do período e o preço de agora', () => {
    expect(
      resumirHistorico([
        { dia: '2026-10-01', menorPrecoCentavos: 90000, medianaCentavos: 95000 },
        { dia: '2026-10-02', menorPrecoCentavos: 80000, medianaCentavos: 90000 },
        { dia: '2026-10-03', menorPrecoCentavos: 85000, medianaCentavos: 92000 },
      ]),
    ).toEqual({
      menor: { precoCentavos: 80000, dia: '2026-10-02' },
      atualCentavos: 85000,
      dias: 3,
    });
  });

  it('sem histórico, não há resumo', () => {
    expect(resumirHistorico([])).toBeUndefined();
  });
});
