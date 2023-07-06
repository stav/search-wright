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

  private async parsePdf(item: Item) {
    const anchor = this.page.locator('a', {hasText: 'Full Report'}).first()
    const href = await anchor.getAttribute('href')
    const downloadPromise = this.page.waitForEvent('download')
    await anchor.click()
    const download = await downloadPromise
    const path = await download.path()
    await download.saveAs(`./test-results/inspections-provider-${item.provider}.pdf`);
    const buffer = path as unknown as Buffer
    const options = {max: 2} // max pages
    const pdf = await pdfParse(buffer, options)
    const s = [
      'Infant',
      'Young Toddler',
      'Total Under',
      'Older Toddler',
      'Preschool',
      'School Age',
      'Total Capacity',
    ]
    const lines = pdf.text.split('\n').filter(line => s.some(v => line.includes(v)))
    // Get rid of any lines after the totals line
    for (let i=0; i<lines.length; i++) {
      if (lines[i].includes('Total Capacity')) {
        lines.splice(i+1)
      }
    }
    // Parse the totals line
    const totalLine = lines.filter(line => line.includes('Total Capacity'))
    let totalMatch: Array<string>
    totalMatch = totalLine[0]?.match(/(\d+)\s+\d+\s+\d+\s+(\d+)\s*$/) || []
    item.student = {
      capacity: parseInt(totalMatch[1]),
      enrollment: parseInt(totalMatch[2]),
      href,
      path,
      lines,
    }
  }

  private async getItem(p: Item): Promise<Item> {

    // Grab provider info: county, adminm phone
    let url: URL | null | undefined

    // Go to the provider page
    url = new URL(`/provider/${p.provider}/?q=${this.q}`, this.searchUrl)
    await this.page.goto(url.href)
    await this.page.waitForLoadState()
    await this.page.locator('.detailGroupContainer').waitFor()
    await this.page.screenshot({path:`./test-results/screenshot-provider-${p.provider}.png`})
    p.county = await this.grabInfo('County:')
    p.admin = await this.grabInfo('Administrator(s):')
    p.phone = await this.grabInfo('Phone:')

    // Grab inspections info: number of students

    // Go to the inspections page
    try {
      url = await this.grabUrl('Current Inspections:')
    } catch (error) {
      url = null
    }
    if (!url) {
      p.student = {message: 'No inspection link'}
      return p
    }
    await this.page.goto(url.href)
    await this.page.waitForLoadState()
    await this.page.locator('#inspectionsHeader').waitFor()
    await this.page.screenshot({path:`./test-results/screenshot-provider-${p.provider}-inspect.png`})
    // Parse the PDF
    const results = await this.page.locator('.resultsList').count()
    const reports = await this.page.locator('a', {hasText: 'Full Report'}).count()
    console.log('results', results, 'reports', reports)
    if (results && reports) {
      await this.parsePdf(p)
    } else {
      p.student = {message: 'No inspection reports', results, reports}
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
        await this.delay(1600)
      }
      console.log('Capture providers', items.length, items[0])
      const content = JSON.stringify(items)
      const index = file.match(/search-page-(\d\d\d).json/) || []

      await writeFile(`./test-data/search-deep-${index[1]}.json`, content)
    }
  }
}
