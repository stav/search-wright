import { test, expect } from '@playwright/test'

import { HomePage } from '../pages/home'

test('child care search', async ({ page }) => {
  const homepage = new HomePage(page)
  await homepage.open()
  await homepage.search()
})
