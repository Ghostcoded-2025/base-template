import { supabase } from '@/lib/supabase'

function functionsBaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('Missing VITE_SUPABASE_URL')
  }
  return `${url.replace(/\/$/, '')}/functions/v1`
}

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return session.access_token
}

async function postJson<T>(functionName: string, body: unknown): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${functionsBaseUrl()}/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) {
    let message = text || res.statusText
    try {
      const parsed = JSON.parse(text) as { error?: string }
      if (typeof parsed.error === 'string') {
        message = parsed.error
      }
    } catch {
      /* keep message */
    }
    throw new Error(message)
  }
  return JSON.parse(text) as T
}

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  roles: string[]
}

export const adminAPI = {
  async listUsers(params?: { search?: string }) {
    return postJson<{
      users: AdminUserRow[]
    }>('list-admin-users', params ?? {})
  },

  async setUserRoles(email: string, roles: string[]) {
    return postJson<{ ok: boolean; assigned: string[] }>('assign-role', {
      email,
      roles,
    })
  },
}
