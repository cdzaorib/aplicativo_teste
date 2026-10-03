/**
 * Conteúdo da aba Gestação: lembretes do pré-natal, sinais de alerta e curiosidades.
 *
 * O app não é médico. Tudo aqui é informação geral, com a fonte citada, para a pessoa conversar
 * com a equipe de pré-natal, que define o que vale para cada gestação. Pesquisado em out/2026;
 * precisa da mesma revisão profissional do catálogo antes de publicar.
 */

/** Momento do pré-natal em que um lembrete faz sentido (semanas de gestação, inclusive). */
export type LembretePreNatal = {
  de: number;
  ate: number;
  titulo: string;
  texto: string;
  fonte: string;
};

export const LEMBRETES_PRE_NATAL: LembretePreNatal[] = [
  {
    de: 0,
    ate: 12,
    titulo: 'Comece o pré-natal',
    texto:
      'A primeira consulta deve acontecer até a 12ª semana. Leve a Caderneta da Gestante a todas as consultas e exames.',
    fonte: 'Ministério da Saúde',
  },
  {
    de: 20,
    ate: 42,
    titulo: 'Vacina dTpa',
    texto:
      'A partir da 20ª semana, a gestante toma uma dose da vacina dTpa (difteria, tétano e coqueluche), em toda gravidez, mesmo que já tenha sido vacinada antes. A da gripe entra nas campanhas, e a de hepatite B depende do cartão de vacinas.',
    fonte: 'Ministério da Saúde (Programa Nacional de Imunizações)',
  },
  {
    de: 24,
    ate: 28,
    titulo: 'Exame de glicose',
    texto:
      'Entre a 24ª e a 28ª semana costuma ser feito o teste de tolerância à glicose, que investiga o diabetes gestacional. Pergunte à sua equipe se ele está no seu plano.',
    fonte: 'Ministério da Saúde, FEBRASGO e Sociedade Brasileira de Diabetes',
  },
  {
    de: 28,
    ate: 42,
    titulo: 'Movimentos do bebê',
    texto:
      'Conheça o jeito de o seu bebê se mexer. Se ele mexer bem menos que o normal, ou parar, procure atendimento no mesmo dia, sem esperar a próxima consulta.',
    fonte: 'NHS (sistema de saúde do Reino Unido)',
  },
  {
    de: 32,
    ate: 42,
    titulo: 'Maternidade de referência',
    texto:
      'Toda gestante tem direito a saber, desde o pré-natal, em qual maternidade será atendida no parto. Combine com a sua equipe para onde ir e quando.',
    fonte: 'Lei 11.634/2007',
  },
  {
    de: 40,
    ate: 42,
    titulo: 'Passou da data prevista',
    texto:
      'É comum o bebê nascer depois da data prevista. Continue indo às consultas, que ficam mais frequentes nessa fase, e siga a orientação da sua equipe.',
    fonte: 'ACOG (Colégio Americano de Obstetras e Ginecologistas)',
  },
];

/** Lembretes que valem para esta semana de gestação. */
export function lembretesDaSemana(semanas: number): LembretePreNatal[] {
  return LEMBRETES_PRE_NATAL.filter(
    (lembrete) => semanas >= lembrete.de && semanas <= lembrete.ate,
  );
}

/** Com que frequência costumam ser as consultas nesta fase, pelo Ministério da Saúde. */
export function ritmoDasConsultas(semanas: number): string {
  if (semanas < 28) return 'Até a 28ª semana, as consultas costumam ser mensais.';
  if (semanas < 36) return 'Da 28ª à 36ª semana, as consultas costumam ser a cada 15 dias.';
  return 'Depois da 36ª semana, as consultas costumam ser semanais, até o parto.';
}

export const CONSULTAS_MINIMAS =
  'O Ministério da Saúde recomenda pelo menos 7 consultas de pré-natal ao longo da gravidez.';

/** Procure atendimento na hora, sem esperar a próxima consulta, se tiver algum destes sinais. */
export const SINAIS_DE_ALERTA = [
  'Sangramento pela vagina ou perda de líquido.',
  'Dor de cabeça forte que não passa, ou visão embaçada, com pontos ou luzes.',
  'Inchaço repentino no rosto, nas mãos ou nos pés.',
  'Febre (38 °C ou mais) ou calafrios.',
  'Dor forte na barriga que não passa.',
  'Contrações regulares antes da 37ª semana.',
  'Falta de ar, dor no peito ou coração muito acelerado.',
  'Tontura ou desmaio.',
  'Vômitos fortes, que não deixam comer ou beber.',
  'O bebê parou de mexer ou está mexendo bem menos que o normal.',
];

export const FONTE_SINAIS_DE_ALERTA =
  'CDC (Hear Her, sinais de alerta urgentes) e NHS (sistema de saúde do Reino Unido)';

/** Curiosidade sobre a gravidez, para a semana em que ela faz sentido (inclusive). */
export type Curiosidade = { de: number; ate: number; texto: string; fonte: string };

export const CURIOSIDADES: Curiosidade[] = [
  {
    de: 0,
    ate: 8,
    texto:
      'A gravidez é contada a partir do primeiro dia da última menstruação. Por isso, nas duas primeiras "semanas de gestação" ainda não há gravidez de fato.',
    fonte: 'ACOG',
  },
  {
    de: 5,
    ate: 10,
    texto:
      'O coração do bebê começa a bater por volta da 6ª semana e já pode aparecer no ultrassom transvaginal.',
    fonte: 'American Pregnancy Association',
  },
  {
    de: 10,
    ate: 18,
    texto:
      'As impressões digitais do bebê começam a se formar por volta da 12ª semana e já estão desenhadas perto da 16ª.',
    fonte: 'MedlinePlus (Biblioteca Nacional de Medicina dos EUA)',
  },
  {
    de: 14,
    ate: 24,
    texto:
      'Os primeiros movimentos do bebê costumam ser sentidos entre a 16ª e a 24ª semana, como bolhinhas ou batidinhas leves. Na primeira gravidez, muitas vezes só depois da 20ª.',
    fonte: 'NHS',
  },
  {
    de: 20,
    ate: 30,
    texto:
      'Por volta da 22ª semana, a audição do bebê começa a funcionar e ele passa a reagir a sons.',
    fonte: 'MedlinePlus',
  },
  {
    de: 24,
    ate: 32,
    texto: 'Os olhos do bebê, fechados até então, se abrem entre a 26ª e a 28ª semana.',
    fonte: 'MedlinePlus',
  },
  {
    de: 12,
    ate: 40,
    texto:
      'O volume de sangue de quem está grávida aumenta cerca de 40% a 50%, para levar oxigênio e nutrientes ao bebê.',
    fonte: 'ACOG',
  },
  {
    de: 16,
    ate: 42,
    texto: 'Ao longo da gravidez, o útero cresce do tamanho de uma pera ao de uma melancia.',
    fonte: 'ACOG',
  },
  {
    de: 28,
    ate: 42,
    texto:
      'O bebê treina a respiração ainda na barriga: faz movimentos parecidos com respirar e engole líquido amniótico.',
    fonte: 'GLOWM (Biblioteca Global de Medicina da Mulher)',
  },
  {
    de: 34,
    ate: 42,
    texto:
      'Só cerca de 4% dos bebês nascem exatamente na data prevista. A maioria nasce nas duas semanas antes ou depois.',
    fonte: 'Perinatal Institute (Reino Unido)',
  },
  {
    de: 36,
    ate: 42,
    texto:
      'Os médicos chamam de "termo completo" o período entre a 39ª e a 40ª semana. Da 37ª à 38ª semana é "termo precoce".',
    fonte: 'ACOG',
  },
];

/**
 * Curiosidade para mostrar hoje. Com a data prevista, escolhe entre as da semana atual (muda a
 * cada semana); sem ela, roda entre todas, uma por dia.
 */
export function curiosidadeDoMomento(semanas: number | undefined, diaDoAno: number): Curiosidade {
  if (semanas !== undefined) {
    const daSemana = CURIOSIDADES.filter((c) => semanas >= c.de && semanas <= c.ate);
    if (daSemana.length) return daSemana[semanas % daSemana.length];
  }
  return CURIOSIDADES[diaDoAno % CURIOSIDADES.length];
}
