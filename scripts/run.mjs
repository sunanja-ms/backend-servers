import { spawn, execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync } from 'fs'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Load .env
const envPath = resolve(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

async function waitForDB(maxRetries = 15) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect()
      await client.query('SELECT 1')
      client.release()
      console.log('✓ Database connected')
      return pool
    } catch {
      console.log(`Waiting for database (${i + 1}/${maxRetries})...`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw new Error('Database connection failed after retries')
}

async function migrate(pool) {
  const sqlPath = resolve(root, 'src/config/migration-ecommerce.sql')
  if (!existsSync(sqlPath)) {
    console.log('⚠ No migration file found, skipping')
    return
  }
  const sql = readFileSync(sqlPath, 'utf-8')
  await pool.query(sql)
  console.log('✓ Migrations applied')
}

function buildFrontend() {
  console.log('Building frontend...')
  execSync('npm run build', { cwd: resolve(root, 'public'), stdio: 'inherit' })
  console.log('✓ Frontend built')
}

function startBackend() {
  const isDev = process.env.NODE_ENV !== 'production'
  const cmd = isDev ? 'npx' : 'node'
  const args = isDev ? ['tsx', 'watch', 'src/server.ts'] : ['dist/server.js']
  const proc = spawn(cmd, args, { cwd: root, stdio: 'inherit', env: process.env })

  process.on('SIGINT', () => { proc.kill('SIGINT'); process.exit(0) })
  process.on('SIGTERM', () => { proc.kill('SIGTERM'); process.exit(0) })

  proc.on('exit', (code) => {
    console.log(`Server exited with code ${code}`)
    process.exit(code ?? 0)
  })
}

async function main() {
  const pool = await waitForDB()
  await migrate(pool)
  await pool.end()
  buildFrontend()
  startBackend()
}

main().catch(err => { console.error(err); process.exit(1) })
