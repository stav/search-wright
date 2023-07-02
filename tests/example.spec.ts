import { test, expect } from '@playwright/test';

const url = 'http://childcaresearch.ohio.gov/';

function createAbsoluteUrl(base: string, relative: string): string {
  const absoluteUrl = new URL(relative, base);
  return absoluteUrl.href;
}

test('has title', async ({ page }) => {
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

  for (const row of rows) {
    const result = row.locator('.resultsListColumn a')
    const href = await result.getAttribute('href') as string
    const absoluteUrl = createAbsoluteUrl(page.url(), href);
    console.log(typeof absoluteUrl, absoluteUrl)

    await page.goto(href)
    await page.screenshot({path:'screenshot2.png'})

  }

});
