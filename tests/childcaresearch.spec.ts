import { test, expect } from '@playwright/test';

import { HomePage } from '../pages/home';

function createAbsoluteUrl(base: string, relative: string): string {
  const absoluteUrl = new URL(relative, base);
  return absoluteUrl.href;
}

test('child care search', async ({ page }) => {
  const homepage = new HomePage(page);
  await homepage.open()
  await homepage.search()

  // for (const row of rows) {
  //   console.log(row)
  // }
});
