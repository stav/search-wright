import { test, expect } from '@playwright/test'

import { HomePage } from '../pages/home'
import { SearchPage } from '../pages/search'

test('child care search', async ({ page }) => {
  const homepage = new HomePage(page)
  await homepage.open()
  await new SearchPage(page).search()
})
