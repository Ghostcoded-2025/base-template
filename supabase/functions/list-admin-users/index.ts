import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

import { corsHeaders, jsonResponse } from '../_shared/http.ts'
import { requireAdmin } from '../_shared/require-admin.ts'

type ListBody = {
  search?: string
  org_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authz = await requireAdmin(req)
  if (!authz.ok) {
    return authz.response
  }

  let body: ListBody = {}
  try {
    const text = await req.text()
    if (text.length > 0) {
      body = JSON.parse(text) as ListBody
    }
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const search =
    typeof body.search === 'string' ? body.search.trim().toLowerCase() : ''

  const filterOrgId = authz.isSuperAdmin
    ? typeof body.org_id === 'string' && body.org_id.length > 0
      ? body.org_id
      : null
    : authz.orgId

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500)
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let profileQuery = service.from('profiles').select('id, full_name, org_id')
  if (filterOrgId) {
    profileQuery = profileQuery.eq('org_id', filterOrgId)
  }

  const { data: profiles, error: profilesError } = await profileQuery
  if (profilesError) {
    return jsonResponse({ error: profilesError.message }, 500)
  }

  const profileRows = profiles ?? []
  if (profileRows.length === 0) {
    return jsonResponse({ users: [] })
  }

  const profileIds = profileRows.map((p) => p.id as string)
  const profileMap = new Map(profileRows.map((p) => [p.id as string, p]))

  const collected: { id: string; email: string | undefined }[] = []
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage })
    if (error) {
      return jsonResponse({ error: error.message }, 500)
    }
    const users = data?.users ?? []
    if (users.length === 0) {
      break
    }
    for (const u of users) {
      if (!profileIds.includes(u.id)) {
        continue
      }
      const em = u.email ?? ''
      if (search && !em.toLowerCase().includes(search)) {
        continue
      }
      collected.push({ id: u.id, email: u.email })
    }
    if (users.length < perPage) {
      break
    }
    page += 1
  }

  if (collected.length === 0) {
    return jsonResponse({ users: [] })
  }

  const ids = collected.map((u) => u.id)

  const { data: prRows, error: prError } = await service
    .from('profile_roles')
    .select('profile_id, roles(name)')
    .in('profile_id', ids)

  if (prError) {
    return jsonResponse({ error: prError.message }, 500)
  }

  const rolesByProfile = new Map<string, string[]>()
  for (const row of prRows ?? []) {
    const pid = row.profile_id as string
    const roleName = (row.roles as { name: string } | null)?.name
    if (!roleName) {
      continue
    }
    const list = rolesByProfile.get(pid) ?? []
    list.push(roleName)
    rolesByProfile.set(pid, list)
  }

  const usersOut = collected.map((u) => {
    const prof = profileMap.get(u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      full_name: (prof?.full_name as string | null) ?? null,
      roles: rolesByProfile.get(u.id) ?? [],
    }
  })

  return jsonResponse({
    users: usersOut,
  })
})
