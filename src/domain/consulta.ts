/**
 * Próxima consulta de pré-natal: a data e a hora ficam só no aparelho (dado de saúde), guardadas
 * como texto local "AAAA-MM-DDTHH:MM", sem fuso, porque a consulta é marcada no horário local.
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Coloca os dois-pontos enquanto a pessoa digita: "1430" -> "14:30". */
export function mascararHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos;
}

/** "AAAA-MM-DDTHH:MM" -> data local. */
export function dataDaConsulta(quando: string): Date {
  const [data, hora] = quando.split('T');
  const [ano, mes, dia] = data.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, dia, horas, minutos);
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export type LeituraConsulta = { quando: string } | { erro: string };

/** Lê a data (DD/MM/AAAA) e a hora (HH:MM) digitadas. A consulta precisa estar no futuro. */
export function lerConsulta(
  dataTexto: string,
  horaTexto: string,
  agora = new Date(),
): LeituraConsulta {
  const data = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataTexto);
  if (!data) return { erro: 'Digite a data como DD/MM/AAAA.' };
  const [dia, mes, ano] = [Number(data[1]), Number(data[2]), Number(data[3])];
  const hora = /^(\d{2}):(\d{2})$/.exec(horaTexto);
  if (!hora) return { erro: 'Digite a hora como HH:MM, por exemplo 14:30.' };
  const [horas, minutos] = [Number(hora[1]), Number(hora[2])];
  if (horas > 23 || minutos > 59) return { erro: 'Essa hora não existe.' };

  const quando = new Date(ano, mes - 1, dia, horas, minutos);
  if (quando.getDate() !== dia || quando.getMonth() !== mes - 1) {
    return { erro: 'Essa data não existe.' };
  }
  if (quando.getTime() <= agora.getTime()) return { erro: 'Essa data e hora já passaram.' };
  if (quando.getTime() - agora.getTime() > 366 * MS_POR_DIA) {
    return { erro: 'A consulta fica no máximo um ano à frente.' };
  }
  return {
    quando: `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}T${doisDigitos(horas)}:${doisDigitos(minutos)}`,
  };
}

/** "15/10/2026 às 14:30". */
export function formatarConsulta(quando: string): string {
  const data = dataDaConsulta(quando);
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Se a hora da consulta já chegou. */
export function consultaPassou(quando: string, agora = new Date()): boolean {
  return dataDaConsulta(quando).getTime() <= agora.getTime();
}

/** Aviso agendado no aparelho para a consulta. */
export type AvisoConsulta = {
  id: 'consulta-vespera' | 'consulta-dia';
  data: Date;
  titulo: string;
  corpo: string;
};

/** Hora do aviso da véspera. */
const HORA_DA_VESPERA = 19;

/** Avisos da consulta que ainda não passaram: na véspera, às 19h, e 2 horas antes. */
export function avisosDaConsulta(quando: string, agora = new Date()): AvisoConsulta[] {
  const consulta = dataDaConsulta(quando);
  const horario = `${doisDigitos(consulta.getHours())}:${doisDigitos(consulta.getMinutes())}`;
  const vespera = new Date(consulta);
  vespera.setDate(vespera.getDate() - 1);
  vespera.setHours(HORA_DA_VESPERA, 0, 0, 0);
  const duasHorasAntes = new Date(consulta.getTime() - 2 * 60 * 60 * 1000);

  const avisos: AvisoConsulta[] = [
    {
      id: 'consulta-vespera',
      data: vespera,
      titulo: 'Consulta de pré-natal amanhã',
      corpo: `Amanhã às ${horario}. Separe a Caderneta da Gestante e as perguntas que anotou.`,
    },
    {
      id: 'consulta-dia',
      data: duasHorasAntes,
      titulo: 'Consulta de pré-natal hoje',
      corpo: `Às ${horario}. Leve a Caderneta da Gestante.`,
    },
  ];
  return avisos.filter((aviso) => aviso.data.getTime() > agora.getTime());
}
