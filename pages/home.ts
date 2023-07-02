import { expect } from '@playwright/test'

import type { Page } from '@playwright/test'
// import { isVisible } from '../framework/common-actions'

const url = 'http://childcaresearch.ohio.gov/'

export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto(url);
    await expect(this.page).toHaveTitle(/Ohio Child Care Search/)
    await this.page.screenshot({path:'screenshot-open.png'})
  }

  async search() {
    await this.page.click('#formActions')
    await this.page.waitForLoadState()
    await this.page.screenshot({path:'screenshot-search.png'})

    // await page.locator('.resultsListRow').waitFor()
    const results = this.page.locator('.resultsListRow')
    const rows = await results.all()
    console.warn('Rows:', rows.length)
    await expect(results).toHaveCount(20)
  }

  // async userIsLoggedIn(): Promise<boolean> {
  //     return await isVisible(this.page, 'a[routerlink="/editor"]');
  // }

  async goToSettings() {
    await this.page.click('a[routerlink="/settings"]');
  }
}
