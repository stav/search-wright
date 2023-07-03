import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

import { readdir, writeFile } from 'fs/promises'

import type { Item } from '.'

import { scrape, child } from './utils'

export class SearchPage {
  readonly page: Page
  private index: number = 0
  private lastIndex: number

  private pindex() {
    return `${this.index}`.padStart(3, '0')
  }

  constructor(page: Page) {
    this.page = page;
  }

  private async getUrlFromCss(css: string, target?: Locator) {
    const _target = target || this.page
    const locator = _target.locator(css)
    expect(locator).toBeTruthy()
    const href = await locator.first().getAttribute('href') as string
    return new URL(href, this.page.url())
  }

  private async saveLastIndex() {
    const url = await this.getUrlFromCss('.NextLast a:nth-child(2)')
    const p = url.searchParams.get('p') || 0
    this.lastIndex = +p
  }

  private async getNextCachedIndex() {
      // Check for previous run
      const files = await readdir('./test-data')
      files.sort().reverse()                   // ["search-page-000.json"]
      console.log('Cache:', files.length, files)
      if (files.length) {
        const file = files[0]                  // "search-page-000.json"
        const parts = file.split('-')          // [ "search", "page", "000.json" ]
        const index = parts[2].substring(0, 3) // "000"
        return parseInt(index) + 1             // 1
      }
  }

  private async gotoIndex(index: number) {
    const url = new URL(this.page.url())
    url.searchParams.set('p', `${index}`)
    console.log('goto index:', typeof index, index, url.href)
    this.page.goto(url.href)
    await this.page.locator('.FirstPrev').waitFor()
    this.index = index
  }

  private async screenshot() {
    await this.page.screenshot({path:`./test-results/screenshot-page-${this.pindex()}.png`})
  }

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()
    await this.page.locator('.NextLast').waitFor()

    await this.saveLastIndex()

    const nextCachedIndex = await this.getNextCachedIndex()
    if (nextCachedIndex) {
      await this.gotoIndex(nextCachedIndex)
    }
    await this.capture()
    await this.paginate()
    console.log('LAST:', this.lastIndex)
  }

  async paginate() {
    if (this.index < this.lastIndex) {
      await this.gotoIndex(this.index + 1)
      await this.capture()
      await this.paginate()
    }
  }

  async getItem(row: Locator): Promise<Item> {
    const stars = await row.locator('div:nth-child(7) > .SUTQStarRating').all()
    return {
      index: this.index,
      name: await child(row, 2),
      address: await child(row, 3),
      city: await child(row, 4),
      zip: await child(row, 5),
      type: await scrape(row, 'div:nth-child(6) > .desktopOnlyDisplay'),
      rating: stars.length,
    }
  }

  async capture() {
    await this.screenshot()
    const results = this.page.locator('.resultsListRow')
    const rows: Locator[] = await results.all()
    console.warn('Rows:', rows.length)

    const params = new URL(this.page.url()).searchParams
    this.index = parseInt(params.get('p') || '0')

    const items: Item[] = []

    for (const row of rows) {
      items.push(await this.getItem(row))
    }
    console.log('Capture', items.length, items[0])
    const content = JSON.stringify(items)
    await writeFile(`./test-data/search-page-${this.pindex()}.json`, content)
  }
}
