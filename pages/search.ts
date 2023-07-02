import { expect } from '@playwright/test'

import type { Locator, Page } from '@playwright/test'

import { writeFile } from 'fs/promises'

async function scrape(row: Locator, css: string) {
  const result = await row.locator(css).textContent() as string
  return result.trim()
}

async function child(row: Locator, child: number) {
  return await scrape(row, `div:nth-child(${child})`)
}

type Item = {
  index: number,
  name: string
  address: string
  city: string
  zip: string
  type: string
  rating: number
}

export class SearchPage {
  readonly page: Page
  private index: number
  public items: Item[] = []

  constructor(page: Page) {
    this.page = page;
  }

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()
    await this.page.screenshot({path:'./test-results/screenshot-search.png'})
    await this.capture()
  }

  async paginate() {
    const css = '.NextLast a:first-child'
    if (this.page.locator(css)) {
      await this.page.click(css)
      await this.page.waitForLoadState()
      await this.capture()
      await this.page.screenshot({path:`./test-results/screenshot-page-${this.index}.png`})
      await this.paginate()
    }
  }

  async capture() {
    const results = this.page.locator('.resultsListRow')
    const rows = await results.all()
    console.warn('Rows:', rows.length)
    await expect(results).toHaveCount(20)

    const params = new URL(this.page.url()).searchParams
    this.index = parseInt(params.get('p') || '0')

    const items: Item[] = []

    for (const row of rows) {
      const stars = row.locator('div:nth-child(7) > .SUTQStarRating')
      const item: Item = {
        index: this.index,
        name: await child(row, 2),
        address: await child(row, 3),
        city: await child(row, 4),
        zip: await child(row, 5),
        type: await scrape(row, 'div:nth-child(6) > .desktopOnlyDisplay'),
        rating: (await stars.all()).length,
      }
      items.push(item)
    }
    console.log(typeof this.items, this.items.length, items[0])
    const content = JSON.stringify(items)
    await writeFile(`./test-results/search-page-${this.index}.json`, content)
    this.items.push(...items)
  }
}
