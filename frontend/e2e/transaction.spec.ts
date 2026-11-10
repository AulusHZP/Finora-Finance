import { test, expect } from '@playwright/test';

test('creates a transaction and shows it again after reloading', async ({ page }) => {
  const category = {
    id: 'food', name: 'Alimentação', icon: 'utensils', color: '#F59E0B',
    isSystem: true, isIncome: false, createdAt: '2026-01-01T00:00:00.000Z',
  };
  const transactions: Array<Record<string, unknown>> = [];
  const requests: Array<Record<string, unknown>> = [];

  // All account and financial data are fictional and remain inside this test.
  await page.addInitScript(() => {
    localStorage.setItem('finora_token', 'e2e-test-token');
    localStorage.setItem('finora_user', JSON.stringify({ id: 'test-user', name: 'Pessoa Teste', email: 'test@example.com' }));
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (!['fetch', 'xhr'].includes(request.resourceType())) return route.continue();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/categories' && request.method() === 'GET') {
      return route.fulfill({ json: [category] });
    }
    if (pathname === '/transactions' && request.method() === 'GET') {
      return route.fulfill({ json: transactions });
    }
    if (pathname === '/transactions' && request.method() === 'POST') {
      const data = request.postDataJSON() as Record<string, unknown>;
      requests.push(data);
      const created = { ...data, id: 'tx-1', userId: 'test-user', category, createdAt: '2026-01-01T00:00:00.000Z' };
      transactions.push(created);
      return route.fulfill({ status: 201, json: created });
    }
    // Unexpected API requests never reach a real service.
    return route.abort();
  });

  await page.goto('/transactions');
  await expect(page.getByRole('heading', { name: 'Transações' })).toBeVisible();
  await page.getByRole('button', { name: 'Nova transação' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nova transação' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Descrição').fill('Despesa de teste');
  await dialog.getByLabel('Valor (R$)').fill('150,00');
  await dialog.getByLabel('Categoria').selectOption('food');
  await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Despesa de teste')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ categoryId: 'food', description: 'Despesa de teste', amount: 150 });
  expect(requests[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await page.reload();
  await expect(page.getByText('Despesa de teste')).toBeVisible();
});
