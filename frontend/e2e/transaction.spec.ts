import { test, expect } from '@playwright/test';

test('creates a new transaction and verifies it appears in the list', async ({ page }) => {
  // Navigate to transactions page
  await page.goto('/transactions');
  
  // Wait for the page to load
  await expect(page.locator('h1').filter({ hasText: 'Transações' })).toBeVisible();

  // Open "Nova transação" modal
  await page.getByRole('button', { name: /Nova transação/i }).click();

  // Check if modal is visible
  await expect(page.getByRole('heading', { name: 'Nova transação' })).toBeVisible();

  // Create a unique description for the test
  const testDesc = `Teste E2E Gasto ${Date.now()}`;

  // Fill in the description
  await page.fill('input[placeholder="Supermercado, aluguel..."]', testDesc);

  // Fill in the amount (parseCurrencyInputBRL supports 150,00)
  await page.fill('input[placeholder="0,00"]', '150,00');

  // Select a category (e.g. Alimentação or first available)
  // Assuming the <select> has <option> labels mapped to the category names
  // We can just grab the first option that's not empty value
  const select = page.locator('select');
  const optionValue = await select.locator('option').nth(1).getAttribute('value');
  if (optionValue) {
    await select.selectOption(optionValue);
  }

  // Submit the form
  await page.getByRole('button', { name: /Salvar/i }).click();

  // Modal should close
  await expect(page.getByRole('heading', { name: 'Nova transação' })).not.toBeVisible();

  // The newly created transaction should be visible in the list
  await expect(page.getByText(testDesc)).toBeVisible();
});
