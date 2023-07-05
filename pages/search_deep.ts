import { readdir, readFile, writeFile } from 'fs/promises'

import type { Item, Student } from '.'
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

  async grabUrl(label: string) {
    const fieldRow = this.page.locator('.detailRow').filter({hasText: label})
    const href = await fieldRow.locator('.detailInfo a').getAttribute('href')
    if (href) {
      return new URL(href, this.searchUrl)
    } else {
      throw new Error('No inspection link')
    }
  }

  private async getItem(p: Item): Promise<Item> {

    // Grab provider info: county, adminm phone

    // Go to the provider page
    let url = new URL(`/provider/${p.provider}/?q=${this.q}`, this.searchUrl)
    await this.page.goto(url.href)
    await this.page.waitForLoadState()
    await this.page.locator('.detailGroupContainer').waitFor()
    await this.page.screenshot({path:`./test-results/screenshot-provider-${p.provider}.png`})
    p.county = await this.grabInfo('County:')
    p.admin = await this.grabInfo('Administrator(s):')
    p.phone = await this.grabInfo('Phone:')

    // Grab inspections info: number of students

    // Go to the inspections page
    url = await this.grabUrl('Current Inspections:')
    await this.page.goto(url.href)
    await this.page.waitForLoadState()
    await this.page.locator('.resultsList').waitFor()
    await this.page.screenshot({path:`./test-results/screenshot-provider-${p.provider}-inspect.png`})

    // Get the PDF link
    // const anchor = this.page.getByText('Full Report').first()
    // const html = await locator.evaluate(node => node.outerHTML)
    const anchor = this.page.locator('a', {hasText: 'Full Report'}).first()
    const href = await anchor.getAttribute('href')
    let student: Student

    // Go to the PDF
    if (href) {
      // url = new URL(href, this.searchUrl)
      // await this.page.goto(url.href)
      const downloadPromise = this.page.waitForEvent('download')
      await anchor.click()
      const download = await downloadPromise
      // await this.page.waitForLoadState()
      // await this.page.screenshot({path:`./test-results/screenshot-provider-${p.provider}-pdf.png`})
      p.student = {href, path: await download.path()}
    }

    return p
  }

  async search() {
    const files = await readdir('./test-data')
    files.sort()
    console.log('Cache:', files.length, files)

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
