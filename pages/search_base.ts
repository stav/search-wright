import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

import { readdir } from 'fs/promises'

export class SearchBase {

  readonly page: Page
  protected index: number = 0
  protected lastIndex: number
  public searchUrl: URL

  protected pindex() {
    return `${this.index}`.padStart(3, '0')
  }

  constructor(page: Page) {
    this.page = page;
  }

  protected async getUrlFromCss(css: string, target?: Locator) {
    const _target = target || this.page
    const locator = _target.locator(css)
    expect(locator).toBeTruthy()
    const href = await locator.first().getAttribute('href') as string
    return new URL(href, this.page.url())
  }

  protected async saveLastIndex() {
    const url = await this.getUrlFromCss('.NextLast a:nth-child(2)')
    const p = url.searchParams.get('p') || 0
    this.lastIndex = +p
  }

  protected async getNextCachedIndex() {
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

  protected async gotoIndex(index: number) {
    const url = new URL(this.page.url())
    url.searchParams.set('p', `${index}`)
    console.log('goto index:', typeof index, index, url.href)
    await this.page.goto(url.href)
    await this.page.locator('.FirstPrev').waitFor()
    this.index = index
  }

  protected async screenshot() {
    await this.page.screenshot({path:`./test-results/screenshot-page-${this.pindex()}.png`})
  }

}
