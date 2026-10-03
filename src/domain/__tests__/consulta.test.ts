import {
  avisosDaConsulta,
  consultaPassou,
  formatarConsulta,
  lerConsulta,
  mascararHora,
} from '../consulta';

// Sábado, 03/10/2026, 15h.
const AGORA = new Date(2026, 9, 3, 15, 0);

describe('próxima consulta', () => {
  it('coloca os dois-pontos na hora enquanto a pessoa digita', () => {
    expect(mascararHora('14')).toBe('14');
    expect(mascararHora('143')).toBe('14:3');
    expect(mascararHora('14305')).toBe('14:30');
  });

  it('lê a data e a hora digitadas e guarda a hora local', () => {
    expect(lerConsulta('15/10/2026', '14:30', AGORA)).toEqual({ quando: '2026-10-15T14:30' });
  });

  it('recusa datas e horas inválidas, passadas ou longe demais', () => {
    expect(lerConsulta('15/10/26', '14:30', AGORA)).toEqual({
      erro: 'Digite a data como DD/MM/AAAA.',
    });
    expect(lerConsulta('15/10/2026', '1430', AGORA)).toHaveProperty('erro');
    expect(lerConsulta('15/10/2026', '25:00', AGORA)).toEqual({ erro: 'Essa hora não existe.' });
    expect(lerConsulta('31/02/2027', '10:00', AGORA)).toEqual({ erro: 'Essa data não existe.' });
    expect(lerConsulta('03/10/2026', '14:59', AGORA)).toEqual({
      erro: 'Essa data e hora já passaram.',
    });
    expect(lerConsulta('03/12/2027', '10:00', AGORA)).toEqual({
      erro: 'A consulta fica no máximo um ano à frente.',
    });
  });

  it('mostra a consulta como DD/MM/AAAA às HH:MM e sabe quando ela passou', () => {
    expect(formatarConsulta('2026-10-15T09:05')).toBe('15/10/2026 às 09:05');
    expect(consultaPassou('2026-10-03T14:00', AGORA)).toBe(true);
    expect(consultaPassou('2026-10-03T16:00', AGORA)).toBe(false);
  });

  it('avisa na véspera às 19h e 2 horas antes, só o que ainda não passou', () => {
    const avisos = avisosDaConsulta('2026-10-15T14:30', AGORA);
    expect(avisos.map((a) => [a.id, a.data.toLocaleString('pt-BR')])).toEqual([
      ['consulta-vespera', '14/10/2026, 19:00:00'],
      ['consulta-dia', '15/10/2026, 12:30:00'],
    ]);
    expect(avisos[0].corpo).toMatch(/^Amanhã às 14:30/);

    // Consulta amanhã cedo, já depois das 19h de hoje: só o aviso de 2 horas antes.
    const tarde = new Date(2026, 9, 3, 20, 0);
    expect(avisosDaConsulta('2026-10-04T09:00', tarde).map((a) => a.id)).toEqual(['consulta-dia']);
    expect(avisosDaConsulta('2026-10-03T16:00', AGORA)).toEqual([]);
  });
});
