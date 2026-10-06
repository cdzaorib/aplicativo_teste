import { corDoFundo, expect, test, visivel } from './base';

const TELAS = [
  '/',
  '/gestacao',
  '/sugestoes',
  '/conta',
  '/mala',
  '/privacidade',
  '/excluir-conta',
  '/preco/berco',
  '/item/novo',
  '/endereco-que-nao-existe',
];

const TEMAS = [
  { nome: 'Escuro', fundo: 'rgb(18, 20, 20)' },
  { nome: 'Preto', fundo: 'rgb(0, 0, 0)' },
];

for (const { nome, fundo } of TEMAS) {
  test(`tema ${nome}: todas as telas abrem nele e ele fica salvo`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/conta');
    const opcao = visivel(page.getByRole('button', { name: nome, exact: true }));
    await opcao.click();
    await expect(opcao).toHaveAttribute('aria-selected', 'true');

    for (const tela of TELAS) {
      await page.goto(tela);
      await expect.poll(() => corDoFundo(page), { message: tela }).toBe(fundo);
      await expect(visivel(page.getByText('Algo deu errado'))).toHaveCount(0);
    }
  });
}

/** Tira da lista o 404 do endereço que não existe, que o teste visita de propósito. */
test.afterEach(({ errosNaPagina }) => {
  const indice = errosNaPagina.findIndex((erro) => /^404 .*\/endereco-que-nao-existe$/.test(erro));
  if (indice >= 0) errosNaPagina.splice(indice, 1);
});

test('no automático, segue o tema do navegador', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/conta');
  await expect.poll(() => corDoFundo(page)).toBe('rgb(18, 20, 20)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => corDoFundo(page)).toBe('rgb(251, 250, 248)');
});

test('endereço que não existe mostra a página em português, com status 404', async ({
  page,
  errosNaPagina,
}) => {
  const resposta = await page.goto('/endereco-que-nao-existe');
  expect(resposta?.status()).toBe(404);
  errosNaPagina.length = 0;
  await expect(page.getByRole('heading', { name: 'Não achamos esta página' })).toBeVisible();
  await page.getByText('Ir para a minha lista').click();
  await expect(visivel(page.getByText('Por onde começar'))).toBeVisible();
});
