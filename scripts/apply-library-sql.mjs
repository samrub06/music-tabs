#!/usr/bin/env node
/**
 * Apply db/library-likes-and-list-rpc.sql using DATABASE_URL or SUPABASE_DB_URL.
 *
 *   DATABASE_URL='postgresql://...' node scripts/apply-library-sql.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!url) {
  console.error(
    'Missing DATABASE_URL / SUPABASE_DB_URL. Apply db/library-likes-and-list-rpc.sql in the Supabase SQL editor.'
  )
  process.exit(2)
}

const sqlPath = path.join(__dirname, '../db/library-likes-and-list-rpc.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log('Applied db/library-likes-and-list-rpc.sql')
} finally {
  await client.end()
}
