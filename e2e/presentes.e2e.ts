import { expect, test } from './base';

const CODIGO = 'K7P2QX9MABCD2345';

test('o convidado abre o link, escolhe um presente e pode desfazer', async ({ page }) => {
  // O banco simulado: o que as funções do Supabase responderiam.
  let reservado = false;
  const pedidos: string[] = [];
  await page.route('https://*.supabase.co/rest/v1/rpc/**', (rota) => {
    const funcao = rota.request().url().split('/rpc/')[1];
    const corpo = rota.request().postDataJSON();
    pedidos.push(funcao);
    if (funcao === 'ver_lista_presentes') {
      if (corpo.codigo_link !== CODIGO) return rota.fulfill({ json: null });
      return rota.fulfill({
        json: {
          nome: 'Gabi',
          itens: [
            {
              id: 'b1',
              catalogo_id: 'banheira',
              nome: 'Banheira',
              modelo: '',
              quantidade: 1,
              categoria: 'higiene',
              situacao: reservado ? 'reservado' : 'livre',
            },
            {
              id: 'b2',
              catalogo_id: 'berco',
              nome: 'Berço',
              modelo: '',
              quantidade: 1,
              categoria: 'quarto',
              situacao: 'comprado',
            },
          ],
        },
      });
    }
    if (funcao === 'reservar_presente') {
      reservado = true;
      return rota.fulfill({ json: '6f1c2e44-1111-4222-8333-944455556666' });
    }
    if (funcao === 'desfazer_reserva_presente') {
      reservado = false;
      return rota.fulfill({ status: 204, body: '' });
    }
    // As outras chamadas (como as faixas de preço) ficam com a simulação padrão.
    return rota.fallback();
  });

  await page.goto(`/presente/${CODIGO}`);
  await expect(page.getByText('Chá de bebê de Gabi')).toBeVisible();
  await page.getByRole('button', { name: 'Vou dar este' }).click();
  await page.getByLabel('Seu nome').fill('Tia Maria');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText(/A família agradece!/)).toBeVisible();

  // O aparelho do convidado lembra a escolha e deixa desfazer.
  await page.reload();
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.getByRole('button', { name: 'Vou dar este' })).toBeVisible();
  expect(pedidos).toContain('desfazer_reserva_presente');
});

test('um código inventado não abre a lista de ninguém', async ({ page }) => {
  await page.route('https://*.supabase.co/rest/v1/rpc/ver_lista_presentes', (rota) =>
    rota.fulfill({ json: null }),
  );
  await page.goto('/presente/INVENTADO123');
  await expect(page.getByRole('button', { name: 'Vou dar este' })).toHaveCount(0);
  await expect(
    page.getByText('Este link não vale mais. Peça o link novo a quem enviou.'),
  ).toBeVisible();
});
