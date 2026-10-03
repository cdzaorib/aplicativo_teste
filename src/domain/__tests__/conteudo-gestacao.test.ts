import {
  CURIOSIDADES,
  curiosidadeDoMomento,
  LEMBRETES_PRE_NATAL,
  lembretesDaSemana,
  ritmoDasConsultas,
  SINAIS_DE_ALERTA,
} from '../conteudo-gestacao';

const titulos = (semanas: number) => lembretesDaSemana(semanas).map((l) => l.titulo);

describe('conteúdo da aba Gestação', () => {
  it('mostra os lembretes do pré-natal da fase certa', () => {
    expect(titulos(8)).toEqual(['Comece o pré-natal']);
    expect(titulos(16)).toEqual([]);
    expect(titulos(20)).toEqual(['Vacina dTpa']);
    expect(titulos(26)).toEqual(['Vacina dTpa', 'Exame de glicose']);
    expect(titulos(33)).toEqual(['Vacina dTpa', 'Movimentos do bebê', 'Maternidade de referência']);
    expect(titulos(41)).toContain('Passou da data prevista');
  });

  it('diz com que frequência costumam ser as consultas', () => {
    expect(ritmoDasConsultas(12)).toMatch(/mensais/);
    expect(ritmoDasConsultas(30)).toMatch(/a cada 15 dias/);
    expect(ritmoDasConsultas(37)).toMatch(/semanais/);
  });

  it('todo conteúdo de saúde cita a fonte e tem um intervalo de semanas válido', () => {
    for (const item of [...LEMBRETES_PRE_NATAL, ...CURIOSIDADES]) {
      expect(item.fonte.trim()).not.toBe('');
      expect(item.de).toBeLessThanOrEqual(item.ate);
    }
    expect(SINAIS_DE_ALERTA.length).toBeGreaterThan(5);
  });

  it('a curiosidade combina com a semana e muda de uma semana para outra', () => {
    for (let semana = 0; semana <= 42; semana++) {
      const curiosidade = curiosidadeDoMomento(semana, 0);
      const temDaSemana = CURIOSIDADES.some((c) => semana >= c.de && semana <= c.ate);
      if (temDaSemana) {
        expect(semana).toBeGreaterThanOrEqual(curiosidade.de);
        expect(semana).toBeLessThanOrEqual(curiosidade.ate);
      }
    }
    expect(curiosidadeDoMomento(26, 0)).not.toEqual(curiosidadeDoMomento(27, 0));
  });

  it('sem a data prevista, troca de curiosidade a cada dia', () => {
    expect(curiosidadeDoMomento(undefined, 0)).toBe(CURIOSIDADES[0]);
    expect(curiosidadeDoMomento(undefined, 1)).toBe(CURIOSIDADES[1]);
    expect(curiosidadeDoMomento(undefined, CURIOSIDADES.length)).toBe(CURIOSIDADES[0]);
  });
});
