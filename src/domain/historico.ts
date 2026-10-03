/** Um dia do histórico de ofertas de um item (menor preço e mediana do dia, em centavos). */
export type DiaPreco = { dia: string; menorPrecoCentavos: number; medianaCentavos: number };

export type ResumoHistorico = {
  /** Menor preço visto no período e o dia em que apareceu. */
  menor: { precoCentavos: number; dia: string };
  /** Menor preço do dia mais recente. */
  atualCentavos: number;
  /** Quantos dias de coleta há no período. */
  dias: number;
};

/** Resume o histórico para a tela: o menor preço do período e o de agora. */
export function resumirHistorico(historico: DiaPreco[]): ResumoHistorico | undefined {
  if (historico.length === 0) return undefined;
  const menor = historico.reduce((a, b) => (b.menorPrecoCentavos < a.menorPrecoCentavos ? b : a));
  return {
    menor: { precoCentavos: menor.menorPrecoCentavos, dia: menor.dia },
    atualCentavos: historico[historico.length - 1].menorPrecoCentavos,
    dias: historico.length,
  };
}
