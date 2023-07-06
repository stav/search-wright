import { readdir, readFile, writeFile } from 'fs/promises'

import pdfParse from 'pdf-parse'

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

  private async parsePdf(item: Item) {
    const anchor = this.page.locator('a', {hasText: 'Full Report'}).first()
    const href = await anchor.getAttribute('href')
    const downloadPromise = this.page.waitForEvent('download')
    await anchor.click()
    const download = await downloadPromise
    const path = await download.path()
    await download.saveAs(`./test-results/inspections-provider-${item.provider}.pdf`);
    const buffer = path as unknown as Buffer
    const options = {max: 1} // max pages
    const pdf = await pdfParse(buffer, options)
    const s = ['Infant', 'Young Toddler', 'Total Under', 'Older Toddler', 'Preschool', 'School Age', 'Total Capacity']
    const lines = pdf.text.split('\n').filter(line => s.some(v => line.includes(v)))
    item.student = {href, path, lines}
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

    // Parse the PDF
    await this.parsePdf(p)

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
