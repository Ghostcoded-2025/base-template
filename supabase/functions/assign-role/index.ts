import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

import { corsHeaders, jsonResponse } from '../_shared/http.ts'
import { requireSuperAdmin } from '../_shared/require-super-admin.ts'

const ALLOWED_ROLE_NAMES = ['admin', 'super_admin', 'staff'] as const

async function findUserIdByEmail(
  service: ReturnType<typeof createClient>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage })
    if (error || !data?.users?.length) {
      break
    }
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === normalized)
    if (match) {
      return match.id
    }
    if (data.users.length < perPage) {
      break
    }
    page += 1
  }
  return null
}

function normalizeRoleNames(raw: string[]): string[] {
  const unique = [...new Set(raw.map((r) => String(r).trim()).filter(Boolean))]
  for (const name of unique) {
    if (!ALLOWED_ROLE_NAMES.includes(name as (typeof ALLOWED_ROLE_NAMES)[number])) {
      throw new Error(`Unknown role: ${name}`)
    }
  }
  let next = unique
  if (next.includes('super_admin') && !next.includes('admin')) {
    next = [...next, 'admin']
  }
  if (!next.includes('admin')) {
    next = next.filter((n) => n !== 'super_admin')
  }
  return next
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authz = await requireSuperAdmin(req)
  if (!authz.ok) {
    return authz.response
  }

  let body: { email?: string; roles?: string[] }
  try {
    body = (await req.json()) as { email?: string; roles?: string[] }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const rolesInput = Array.isArray(body.roles) ? body.roles : []
  if (!email) {
    return jsonResponse({ error: 'email is required' }, 400)
  }

  let roleNames: string[]
  try {
    roleNames = normalizeRoleNames(rolesInput)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid roles'
    return jsonResponse({ error: message }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500)
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const targetId = await findUserIdByEmail(service, email)
  if (!targetId) {
    return jsonResponse({ error: 'User not found' }, 404)
  }

  if (targetId === authz.userId) {
    return jsonResponse({ error: 'Cannot modify your own roles' }, 403)
  }

  const { data: roleRows, error: rolesError } = await service
    .from('roles')
    .select('id, name')
    .in('name', roleNames)

  if (rolesError || !roleRows) {
    return jsonResponse({ error: rolesError?.message ?? 'Role lookup failed' }, 500)
  }

  if (roleRows.length !== roleNames.length) {
    return jsonResponse({ error: 'Could not resolve all role names' }, 400)
  }

  const { error: delError } = await service.from('profile_roles').delete().eq('profile_id', targetId)
  if (delError) {
    return jsonResponse({ error: delError.message }, 500)
  }

  if (roleNames.length === 0) {
    return jsonResponse({ ok: true, assigned: [] as string[] })
  }

  const inserts = roleRows.map((r) => ({
    profile_id: targetId,
    role_id: r.id,
  }))

  const { error: insError } = await service.from('profile_roles').insert(inserts)
  if (insError) {
    return jsonResponse({ error: insError.message }, 500)
  }

  return jsonResponse({ ok: true, assigned: roleNames })
})
