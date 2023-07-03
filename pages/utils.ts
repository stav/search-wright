import type { Locator } from '@playwright/test'

export async function scrape(row: Locator, css: string) {
  const result = await row.locator(css).textContent() as string
  return result.trim()
}

export async function child(row: Locator, child: number) {
  return await scrape(row, `div:nth-child(${child})`)
}
