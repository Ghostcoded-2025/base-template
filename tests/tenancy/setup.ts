import { execSync } from 'node:child_process'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Seeded in supabase/seed.sql */
export const ACME_ORG_ID = 'f0000000-0000-4000-8000-000000000010'
export const GLOBEX_ORG_ID = 'f0000000-0000-4000-8000-000000000020'

export const SEED_PASSWORD = 'test1234'

export interface SupabaseEnv {
  apiUrl: string
  anonKey: string
}

function parseStatusJson(stdout: string): Record<string, string> {
  const start = stdout.indexOf('{')
  const end = stdout.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON in supabase status output')
  }
  return JSON.parse(stdout.slice(start, end + 1)) as Record<string, string>
}

export function getSupabaseEnv(): SupabaseEnv {
  const apiUrl = process.env.SUPABASE_API_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (apiUrl && anonKey) {
    return { apiUrl, anonKey }
  }

  const raw = execSync('npx supabase status -o json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const status = parseStatusJson(raw)
  const resolvedUrl = status.API_URL
  const resolvedKey = status.ANON_KEY
  if (!resolvedUrl || !resolvedKey) {
    throw new Error(
      'Set SUPABASE_API_URL and SUPABASE_ANON_KEY, or run `supabase start`.'
    )
  }
  return { apiUrl: resolvedUrl, anonKey: resolvedKey }
}

export function createAnonClient(): SupabaseClient {
  const { apiUrl, anonKey } = getSupabaseEnv()
  return createClient(apiUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function signInAs(
  client: SupabaseClient,
  email: string,
  password: string
): Promise<void> {
  await client.auth.signOut()
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(
      `signIn failed for ${email}: ${error.message || JSON.stringify(error)}`
    )
  }
}
