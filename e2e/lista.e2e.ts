import { expect, test, visivel } from './base';

test('monta a lista pelas sugestões, marca, filtra, edita o preço e guarda tudo', async ({
  page,
}) => {
  await page.goto('/');
  await expect(visivel(page.getByText('Por onde começar'))).toBeVisible();

  // Sugestões: adiciona os essenciais e busca no catálogo, sem diferenciar acentos.
  await visivel(page.getByRole('button', { name: 'Ver sugestões' })).click();
  const adicionar = visivel(page.getByRole('button', { name: /Adicionar \d+ itens essenciais/ }));
  const essenciais = Number((await adicionar.textContent())?.match(/\d+/)?.[0]);
  await adicionar.click();
  await visivel(page.getByPlaceholder('Ex.: berço, body, fralda…')).fill('BERCO');
  await expect(visivel(page.getByText('Berço portátil ou moisés', { exact: true }))).toBeVisible();

  // Minha lista: marca o primeiro item como comprado.
  await visivel(page.getByText('Minha lista', { exact: true }))
    .last()
    .click();
  await expect(visivel(page.getByText(`0 de ${essenciais} itens comprados`))).toBeVisible();
  const caixas = visivel(page.getByRole('checkbox', { name: /^Marcar .* como comprado$/ }));
  const primeira = caixas.first();
  const nome = (await primeira.getAttribute('aria-label'))!.replace(
    /^Marcar | como comprado$/g,
    '',
  );
  await primeira.click();
  await expect(
    visivel(page.getByRole('checkbox', { name: `Marcar ${nome} como comprado` })),
  ).toBeChecked();
  await expect(visivel(page.getByText(`1 de ${essenciais} itens comprados`))).toBeVisible();

  // Filtro "Comprados": só o item marcado.
  await visivel(page.getByRole('button', { name: 'Comprados' })).click();
  await expect(caixas).toHaveCount(1);
  await visivel(page.getByRole('button', { name: 'Tudo' })).click();
  await expect(caixas).toHaveCount(essenciais);

  // Edição: o preço salvo volta preenchido.
  await visivel(page.getByText(nome, { exact: true }))
    .first()
    .click();
  await expect(page).toHaveURL(/\/item\//);
  const preco = visivel(page.getByLabel(/^Preço por .* \(R\$\)$/));
  await preco.fill('199,90');
  await visivel(page.getByRole('button', { name: 'Salvar' })).click();
  await expect(page).not.toHaveURL(/\/item\//);

  // Recarregar não perde nada: a lista fica no aparelho.
  await page.reload();
  await expect(visivel(page.getByText(`1 de ${essenciais} itens comprados`))).toBeVisible();
  await visivel(page.getByText(nome, { exact: true }))
    .first()
    .click();
  await expect(visivel(page.getByLabel(/^Preço por .* \(R\$\)$/))).toHaveValue('199,90');
});

test('compara um preço com a faixa comum do item', async ({ page }) => {
  await page.goto('/preco/berco');
  const campo = visivel(page.getByLabel(/^Preço encontrado por .* \(R\$\)$/));
  const avaliar = visivel(page.getByRole('button', { name: 'Avaliar preço' }));

  await campo.fill('150');
  await avaliar.click();
  await expect(visivel(page.getByText('Muito abaixo do normal'))).toBeVisible();

  await campo.fill('799,90');
  await avaliar.click();
  await expect(visivel(page.getByText('Dentro da faixa comum'))).toBeVisible();
});
