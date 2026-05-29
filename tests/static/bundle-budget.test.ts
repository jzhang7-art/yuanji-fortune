import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ASSETS_DIR = join(process.cwd(), 'dist/assets')

describe('bundle budget', () => {
  it('main entry chunk stays under 80KB uncompressed', () => {
    const files = readdirSync(ASSETS_DIR).filter((f) => /^index-.*\.js$/.test(f))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      const size = statSync(join(ASSETS_DIR, f)).size
      expect(size, `${f} is ${size} bytes`).toBeLessThan(80 * 1024)
    }
  })
  it('r3f chunk exists and is split out', () => {
    const files = readdirSync(ASSETS_DIR).filter((f) => /^r3f-.*\.js$/.test(f))
    expect(files.length).toBe(1)
  })
})
