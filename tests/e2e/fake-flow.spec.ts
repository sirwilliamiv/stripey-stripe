import { test, expect } from '@playwright/test'

test.describe('FakePaymentFlow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows Pay button and payment form', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Pay \$20\.00/i })).toBeVisible()
    await expect(page.getByText('4242 4242 4242 4242')).toBeVisible()
  })

  test('completes payment flow and shows success', async ({ page }) => {
    await page.getByRole('button', { name: /Pay \$20\.00/i }).click()
    await expect(page.getByText(/Payment succeeded/i)).toBeVisible({ timeout: 10000 })
  })

  test('emits webhook event visible in ApiLogTab after jumping to end', async ({ page }) => {
    await page.getByRole('button', { name: /Pay \$20\.00/i }).click()
    await expect(page.getByText(/Payment succeeded/i)).toBeVisible({ timeout: 10000 })

    await page.getByTitle('Jump to end').click()

    await expect(page.getByText('payment_intent.succeeded')).toBeVisible()
  })

  test('reset clears the flow', async ({ page }) => {
    await page.getByRole('button', { name: /Pay \$20\.00/i }).click()
    await expect(page.getByText(/Payment succeeded/i)).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /Reset & run again/i }).click()
    await expect(page.getByRole('button', { name: /Pay \$20\.00/i })).toBeVisible()
  })

  test('compliance tab shows PCI state during flow', async ({ page }) => {
    await page.getByRole('button', { name: /Pay \$20\.00/i }).click()
    await expect(page.getByText(/Payment succeeded/i)).toBeVisible({ timeout: 10000 })

    await page.getByTitle('Jump to end').click()
    await page.getByText('Compliance').click()

    await expect(page.getByText('ORDER marked fulfilled in DB')).not.toBeVisible()
  })
})
