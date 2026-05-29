import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf-8')

describe('index.html meta hardening', () => {
  it('has viewport with viewport-fit=cover', () => {
    expect(html).toMatch(/viewport-fit=cover/)
  })
  it('links manifest', () => {
    expect(html).toMatch(/rel="manifest"\s+href="\/manifest\.webmanifest"/)
  })
  it('has apple-touch-icon', () => {
    expect(html).toMatch(/rel="apple-touch-icon"/)
  })
  it('has theme-color', () => {
    expect(html).toMatch(/name="theme-color"\s+content="#0e2a3a"/)
  })
  it('disables phone number auto-detection', () => {
    expect(html).toMatch(/name="format-detection"[^>]*telephone=no/)
  })
  it('declares og:title for share previews', () => {
    expect(html).toMatch(/property="og:title"/)
  })
})
