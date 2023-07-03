import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

import { readdir } from 'fs/promises'

import { SearchBase } from './search_base'
import { SearchListPage } from './search_list'

export class SearchDeepPages extends SearchBase {

  constructor(search: SearchListPage) {
    super(search.page)
    this.searchUrl = search.searchUrl
  }

  async search() {
    const files = await readdir('./test-data')
    files.sort()
    console.log('Cache:', files.length, files)
    console.log('Url:', this.searchUrl)

    for (const file of files) {
      //
    }
  }
}
