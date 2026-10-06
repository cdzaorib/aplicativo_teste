import { test as base, expect, type Locator, type Page } from '@playwright/test';

/**
 * Teste com o Supabase simulado e sem erros no console. Sem login, o app só lê as ofertas e as
 * faixas de preço informadas; cada teste pode simular outras chamadas com `page.route`, que vale
 * antes desta (o Playwright usa a rota registrada por último).
 */
export const test = base.extend<{ errosNaPagina: string[] }>({
  errosNaPagina: [
    async ({ page }, usar) => {
      const erros: string[] = [];
      page.on('pageerror', (erro) => erros.push(erro.message));
      page.on('console', (mensagem) => {
        // Uma resposta com erro aparece abaixo, já com o endereço.
        if (mensagem.type() === 'error' && !mensagem.text().startsWith('Failed to load resource'))
          erros.push(mensagem.text());
      });
      page.on('response', (resposta) => {
        if (resposta.status() >= 400) erros.push(`${resposta.status()} ${resposta.url()}`);
      });
      await page.route('https://*.supabase.co/**', (rota) => rota.fulfill({ json: [] }));
      // O teste pode tirar da lista os erros que espera (por exemplo, um 404 de propósito).
      await usar(erros);
      expect(erros, 'erros na página').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** As abas ficam montadas mesmo escondidas: só interessa o que está na tela. */
export const visivel = (localizador: Locator) => localizador.filter({ visible: true });

/** Data daqui a `dias` dias, como a pessoa digita (DDMMAAAA, a máscara põe as barras). */
export function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const d = (n: number) => String(n).padStart(2, '0');
  return `${d(data.getDate())}${d(data.getMonth() + 1)}${data.getFullYear()}`;
}

/** Cor de fundo da tela (a do primeiro bloco com fundo próprio). */
export function corDoFundo(page: Page): Promise<string> {
  return page.evaluate(() => {
    const bloco = [...document.querySelectorAll('div')].find(
      (div) => getComputedStyle(div).backgroundColor !== 'rgba(0, 0, 0, 0)',
    );
    return bloco ? getComputedStyle(bloco).backgroundColor : '';
  });
}
