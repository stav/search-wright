import type { Page } from '@playwright/test'

import { readdir, writeFile } from 'fs/promises'

import type { Item } from '.'

import { scrape, child } from './utils'

export class SearchPage {
  readonly page: Page
  private index: number = 0
  public items: Item[] = []

  private pindex() {
    return `${this.index}`.padStart(3, '0')
  }

  constructor(page: Page) {
    this.page = page;
  }

  private async getNextCachedIndex() {
      // Check for previous run
      const files = await readdir('./test-data')
      files.sort().reverse()
      console.log(files, files.length)
      if (files.length) {
        const file = files[0]
        const parts = file.split('-')
        const index = parts[2].substring(0, 3)
        return parseInt(index) + 1
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

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()

    const nextCachedIndex = await this.getNextCachedIndex()
    if (nextCachedIndex) {
      await this.gotoIndex(nextCachedIndex)
    }
    await this.page.screenshot({path:`./test-results/screenshot-page-${this.pindex()}.png`})
    await this.capture()
  }

  async paginate() {
    const css = '.NextLast a:first-child'
    if (this.page.locator(css)) {
      await this.page.click(css)
      await this.page.waitForLoadState()
      await this.capture()
      await this.page.screenshot({path:`./test-results/screenshot-page-${this.pindex()}.png`})
      await this.paginate()
    }
  }

  async capture() {
    const results = this.page.locator('.resultsListRow')
    const rows = await results.all()
    console.warn('Rows:', rows.length)

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
    await writeFile(`./test-data/search-page-${this.pindex()}.json`, content)
    this.items.push(...items)
  }
}
