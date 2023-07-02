import { test } from '@playwright/test'

import { HomePage } from '../pages/home'
import { SearchPage } from '../pages/search'

test('child care search', async ({ page }) => {
  const homePage = new HomePage(page)
  await homePage.open()

  const searchPage = new SearchPage(page)
  await searchPage.search()
})
