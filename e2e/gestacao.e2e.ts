import { daquiA, expect, test, visivel } from './base';

test('acompanha a gestação: data prevista, próxima consulta e mala da maternidade', async ({
  page,
}) => {
  await page.goto('/gestacao');
  await expect(visivel(page.getByText(/não substitui o pré-natal/))).toBeVisible();

  await visivel(page.getByLabel('Data prevista do parto')).fill(daquiA(100));
  await visivel(page.getByRole('button', { name: 'Salvar data' })).click();
  await expect(visivel(page.getByText(/^\d+ semanas e \d+ dias?/))).toBeVisible();

  await visivel(page.getByLabel('Data da consulta')).fill(daquiA(7));
  await visivel(page.getByLabel('Hora', { exact: true })).fill('0930');
  await visivel(page.getByRole('button', { name: 'Salvar consulta' })).click();
  await expect(visivel(page.getByText(/às 09:30$/))).toBeVisible();
  await visivel(page.getByLabel('Perguntas para levar')).fill('Posso viajar de avião?');

  await visivel(page.getByRole('button', { name: 'Ver o que levar' })).click();
  await expect(page).toHaveURL(/\/mala$/);
  const caderneta = page.getByRole('checkbox', { name: 'Caderneta da Gestante' });
  await caderneta.click();
  await expect(caderneta).toBeChecked();
  await expect(page.getByText('1 de 36 itens prontos', { exact: true })).toBeVisible();
  await expect(page.getByText(/Deixe a mala pronta até \d\d\/\d\d\/\d{4}/)).toBeVisible();

  // Tudo fica no aparelho e volta depois de recarregar.
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Caderneta da Gestante' })).toBeChecked();
  await page.goto('/gestacao');
  await expect(visivel(page.getByText(/às 09:30$/))).toBeVisible();
  await expect(visivel(page.getByLabel('Perguntas para levar'))).toHaveValue(
    'Posso viajar de avião?',
  );
});

test('não aceita consulta numa data que já passou', async ({ page }) => {
  await page.goto('/gestacao');
  await visivel(page.getByLabel('Data da consulta')).fill('01012020');
  await visivel(page.getByLabel('Hora', { exact: true })).fill('1000');
  await visivel(page.getByRole('button', { name: 'Salvar consulta' })).click();
  await expect(visivel(page.getByText('Essa data e hora já passaram.'))).toBeVisible();
});
