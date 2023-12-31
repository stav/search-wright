import type { Locator, Page } from '@playwright/test'

import { writeFile } from 'fs/promises'

import type { Item } from '.'
import { SearchBase } from './search_base'
import { scrape, child } from './utils'

export class SearchListPage extends SearchBase {

  constructor(page: Page) {
    super(page)
  }

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()
    await this.page.locator('.NextLast').waitFor()
    await this.saveLastIndex()
    this.searchUrl = new URL(this.page.url())
  }

  async scrape() {
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
      await this.delay(1000)
      await this.capture()
      await this.paginate()
    }
  }

  private async getItem(row: Locator): Promise<Item> {
    const stars = await row.locator('div:nth-child(7) > .SUTQStarRating').all()
    const url = await this.getUrlFromCss('.programListColumnName a', row)
    const provider = url.href.match("/provider/([0-9]+)/") || [null, url.href]
    return {
      index: this.index,
      provider: provider[1],
      name: await child(row, 2),
      address: await child(row, 3),
      city: await child(row, 4),
      zip: await child(row, 5),
      type: await scrape(row, 'div:nth-child(6) > .desktopOnlyDisplay'),
      rating: stars.length,
      student: undefined,
      county: undefined,
      phone: undefined,
      admin: undefined,
    }
  }

  async capture() {
    await this.screenshot()
    const results = this.page.locator('.resultsListRow')
    const rows: Locator[] = await results.all()
    console.log('Rows:', rows.length)

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
