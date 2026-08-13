/**
 * Copy Next.js brand icons into Capacitor www for splash/fallback.
 * Run from mobile/: npm run copy:icons
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const brandDir = path.join(root, 'public', 'brand')
const outDir = path.resolve(__dirname, '../www/brand')

fs.mkdirSync(outDir, { recursive: true })
for (const file of ['icon.png', 'apple-touch-icon.png', 'logo_tabasco.png']) {
  const src = path.join(brandDir, file)
  if (!fs.existsSync(src)) {
    console.warn('skip missing', src)
    continue
  }
  fs.copyFileSync(src, path.join(outDir, file))
  console.log('copied', file)
}
