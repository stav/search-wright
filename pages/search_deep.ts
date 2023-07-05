import { readdir, readFile, writeFile } from 'fs/promises'

import type { Item } from '.'
import { SearchBase } from './search_base'
import { SearchListPage } from './search_list'

export class SearchDeepPages extends SearchBase {

  q: string | null

  constructor(search: SearchListPage) {
    super(search.page)
    this.searchUrl = search.searchUrl
    this.q = this.searchUrl.searchParams.get('q')
  }

  async grabInfo(label: string) {
    const fieldRow = this.page.locator('.detailRow').filter({hasText: label})
    const field = await fieldRow.locator('.detailInfo').textContent()
    return field?.trim()
  }

  private async getItem(p: Item): Promise<Item> {
    const url = new URL(`/provider/${p.provider}/?q=${this.q}`, this.searchUrl)
    await this.page.goto(url.href)
    await this.page.waitForLoadState()
    await this.page.locator('.detailGroupContainer').waitFor()
    await this.page.screenshot({path:`./test-results/screenshot-${this.pindex()}-provider-${p.provider}.png`})

    p.county = await this.grabInfo('County:')
    p.admin = await this.grabInfo('Administrator(s):')
    p.phone = await this.grabInfo('Phone:')

    return p
  }

  async search() {
    const files = await readdir('./test-data')
    files.sort()
    console.log('Cache:', files.length, files)
    console.log('Url:', this.searchUrl)

    for (const file of files) {

      const path = `./test-data/${file}`
      const json = await readFile(path) as unknown as string
      console.log('JSON', typeof json, json.length)
      const providers: Item[] = JSON.parse(json)
      console.log('providers:', providers.length)

      const items: Item[] = []

      for (const provider of providers) {
        items.push(await this.getItem(provider))
      }
      console.log('Capture providers', items.length, items[0])
      const content = JSON.stringify(items)
      const index = file.match(/search-page-(\d\d\d).json/) || []

      await writeFile(`./test-data/search-deep-${index[1]}.json`, content)
    }
  }
}
