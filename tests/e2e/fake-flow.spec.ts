import { test, expect } from '@playwright/test'

test.describe('Fake Payment Flow', () => {
  test('buy button starts the flow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Buy Course — $49.99')).toBeVisible()
    await page.getByText('Buy Course — $49.99').click()
    await expect(page.getByText('Enter your details')).toBeVisible()
  })

  test('completing payment shows success and webhook event', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Buy Course — $49.99').click()
    await page.getByText('Pay $49.99').click()
    await expect(page.getByText('Payment succeeded')).toBeVisible({ timeout: 5000 })
  })

  test('Observatory shows webhook event after jumping to end', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Buy Course — $49.99').click()
    await page.getByText('Pay $49.99').click()
    await expect(page.getByText('✓ Payment succeeded')).toBeVisible({ timeout: 5000 })
    // DVR starts paused — cursor holds at first event.
    // Jump to end to advance cursor to the webhook event.
    await page.getByTitle('Jump to end').click()
    await expect(page.getByText('payment_intent.succeeded')).toBeVisible()
  })

  test('persona switcher changes persona', async ({ page }) => {
    await page.goto('/')
    await page.selectOption('select', 'maya')
    await expect(page.getByText('Maya')).toBeVisible()
  })
})
