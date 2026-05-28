import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, 'lint-tenant-policies.sql')
function dockerContainerName() {
  const fromEnv = process.env.SUPABASE_DB_CONTAINER
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv
  }
  return 'supabase_db_base-template'
}

function runLintViaDocker(sql) {
  const container = dockerContainerName()
  const out = execFileSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-t',
      '-A',
      '-F',
      '|',
    ],
    {
      encoding: 'utf8',
      input: sql,
    }
  )
  return out
}

function runLint() {
  const sql = readFileSync(sqlPath, 'utf8')
  const out = runLintViaDocker(sql)
  const lines = out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.map((line) => {
    const [table_name, rule_id] = line.split('|')
    return { table_name, rule_id }
  })
}

function main() {
  try {
    const violations = runLint()
    if (violations.length === 0) {
      console.log('Tenant policy lint: OK')
      return
    }
    console.error('Tenant policy lint failed:')
    for (const v of violations) {
      console.error(`  - [${v.rule_id}] ${v.table_name}`)
    }
    process.exit(1)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(
      `Tenant policy lint could not run (is Supabase started?). ${message}`
    )
    process.exit(1)
  }
}

main()
