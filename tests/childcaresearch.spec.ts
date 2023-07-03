import { test } from '@playwright/test'

import { HomePage } from '../pages/home'
import { SearchListPage } from '../pages/search_list'
import { SearchDeepPages } from '../pages/search_deep'

test('child care search', async ({ page }) => {
  // test.setTimeout(2 * 60 * 1000);
  test.slow()

  const homePage = new HomePage(page)
  await homePage.open()

  const searchListPage = new SearchListPage(page)
  await searchListPage.search()

  const searchDeepPages = new SearchDeepPages(searchListPage)
  await searchDeepPages.search()
})
