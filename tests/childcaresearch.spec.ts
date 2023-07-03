import { test } from '@playwright/test'

import { HomePage } from '../pages/home'
import { SearchPage } from '../pages/search'

test('child care search', async ({ page }) => {
  // test.setTimeout(2 * 60 * 1000);
  test.slow()

  const homePage = new HomePage(page)
  await homePage.open()

  const searchPage = new SearchPage(page)
  await searchPage.search()
})
