import { test, expect } from '@playwright/test';

const url = 'http://childcaresearch.ohio.gov/';

function createAbsoluteUrl(base: string, relative: string): string {
  const absoluteUrl = new URL(relative, base);
  return absoluteUrl.href;
}

test('child care search', async ({ page }) => {
  await page.goto(url);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Education/)
  await page.screenshot({path:'screenshot1.png'})
  await page.click('#formActions')
  await page.waitForLoadState()
  await page.screenshot({path:'screenshot2.png'})
  // await page.locator('.resultsListRow').waitFor()
  const results = page.locator('.resultsListRow')
  const rows = await results.all()
  console.warn('Rows:', rows.length)
  await expect(results).toHaveCount(20)

});
