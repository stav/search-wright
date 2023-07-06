import { test } from '@playwright/test'

import { HomePage } from '../pages/home'
import { SearchListPage } from '../pages/search_list'
import { SearchDeepPages } from '../pages/search_deep'

test('child care search', async ({ page }) => {
  // Default timeout: 30 seconds
  // test.slow() // 90 seconds
  test.setTimeout(2 * 60 * 1000) // 120 seconds

  const homePage = new HomePage(page)
  await homePage.open()

  const searchListPage = new SearchListPage(page)
  await searchListPage.search()
  await searchListPage.scrape()

  const searchDeepPages = new SearchDeepPages(searchListPage)
  await searchDeepPages.search()
})
