import { expect } from '@playwright/test'

import type { Locator, Page } from '@playwright/test'

import { readdir, writeFile } from 'fs/promises'

import type { Item } from '.'

async function scrape(row: Locator, css: string) {
  const result = await row.locator(css).textContent() as string
  return result.trim()
}

async function child(row: Locator, child: number) {
  return await scrape(row, `div:nth-child(${child})`)
}

export class SearchPage {
  readonly page: Page
  private index: number
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
      console.log(files)
      if (files.length) {
        const file = files[0]
        const parts = file.split('-')
        const index = parts[2].substring(0, 3)
        return parseInt(index) + 1
      }
  }

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()

    const nextCachedIndex = await this.getNextCachedIndex()
    if (nextCachedIndex) {
      const url = new URL(this.page.url())
      url.searchParams.set('p', `${nextCachedIndex}`)
      console.log('GET NEXT!!', typeof nextCachedIndex, nextCachedIndex, url.href)
      this.index = nextCachedIndex
      this.page.goto(url.href)
      const firstNav = this.page.locator('.FirstPrev')
      await firstNav.waitFor()
      await this.page.screenshot({path:`./test-results/screenshot-page-${this.pindex()}.png`})
    } else {
      await this.page.screenshot({path:'./test-results/screenshot-search.png'})
    }
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
