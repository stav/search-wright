import { expect } from '@playwright/test'

import type { Page } from '@playwright/test'

const url = 'http://childcaresearch.ohio.gov/'

export class HomePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async open() {
    await this.page.goto(url)
    await expect(this.page).toHaveTitle(/Ohio Child Care Search/)
    await this.page.screenshot({path:'./test-results/screenshot-open.png'})
  }
}
