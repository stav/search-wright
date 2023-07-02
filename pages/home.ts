import { expect } from '@playwright/test'

import type { Locator, Page } from '@playwright/test'
// import { isVisible } from '../framework/common-actions'

const url = 'http://childcaresearch.ohio.gov/'

type Item = {
  name: string
  address: string
  city: string
  zip: string
  type: string
  rating: number
}

async function scrape(row: Locator, css: string) {
  const result = await row.locator(css).textContent() as string
  return result.trim()
}

async function child(row: Locator, child: number) {
  return await scrape(row, `div:nth-child(${child})`)
}

export class HomePage {
  readonly page: Page
  public results: []

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(url);
    await expect(this.page).toHaveTitle(/Ohio Child Care Search/)
    await this.page.screenshot({path:'screenshot-open.png'})
  }

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()
    await this.page.screenshot({path:'screenshot-search.png'})

    // await page.locator('.resultsListRow').waitFor()
    const results = this.page.locator('.resultsListRow')
    const rows = await results.all()
    console.warn('Rows:', rows.length)
    await expect(results).toHaveCount(20)
    for (const row of rows) {
      const stars = row.locator('div:nth-child(7) > .SUTQStarRating')
      const item: Item = {
        name: await child(row, 2),
        address: await child(row, 3),
        city: await child(row, 4),
        zip: await child(row, 5),
        type: await scrape(row, 'div:nth-child(6) > .desktopOnlyDisplay'),
        rating: (await stars.all()).length,
      }
      console.log(row, item)
    }
  }
}
