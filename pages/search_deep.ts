import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

import { readdir, readFile } from 'fs/promises'

import type { Item } from '.'
import { SearchBase } from './search_base'
import { SearchListPage } from './search_list'

export class SearchDeepPages extends SearchBase {

  constructor(search: SearchListPage) {
    super(search.page)
    this.searchUrl = search.searchUrl
  }

  async grabInfo(label: string) {
    const fieldRow = this.page.locator('.detailRow').filter({hasText: label})
    console.log('countyRow:', typeof fieldRow, fieldRow)
    const field = await fieldRow.locator('.detailInfo').textContent()
    console.log('county:', typeof field, field)
    return field?.trim()
  }

  async search() {
    const files = await readdir('./test-data')
    files.sort()
    console.log('Cache:', files.length, files)
    console.log('Url:', this.searchUrl)

    for (const file of files) {
      const q = this.searchUrl.searchParams.get('q')

      const path = `./test-data/${file}`
      const json = await readFile(path) as unknown as string
      console.log('JSON', typeof json, json.length)
      const providers = JSON.parse(json)
      console.log('providers:', providers.length)

      const items: Item[] = []

      for (const p of providers) {
        const url = new URL(`/provider/${p.provider}/?q=${q}`, this.searchUrl)
        console.log('provider:', url.href)
        this.page.goto(url.href)
        await this.page.waitForLoadState()
        await this.page.screenshot({path:`./test-results/screenshot-${this.pindex()}-provider-${p.provider}.png`})

        p.county = await this.grabInfo('County:')
        p.admin = await this.grabInfo('Administrator(s):')
        p.phone = await this.grabInfo('Phone:')

        console.log('Item:', p)
      }
    }
  }
}
