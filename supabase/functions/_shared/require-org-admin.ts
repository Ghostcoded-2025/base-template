import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

import { corsHeaders, jsonResponse } from './http.ts'

export type OrgAdminAuthResult =
  | { ok: true; userId: string; orgId: string }
  | { ok: false; response: Response }

export async function requireOrgAdmin(req: Request): Promise<OrgAdminAuthResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Unauthorized' }, 401),
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Server misconfigured' }, 500),
    }
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Unauthorized' }, 401),
    }
  }

  const { data: isAdmin, error: roleError } = await userClient.rpc(
    'current_user_has_role',
    { role_name: 'admin' }
  )
  if (roleError || !isAdmin) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Forbidden' }, 403),
    }
  }

  const { data: orgId, error: orgError } = await userClient.rpc('current_user_org_id')
  if (orgError || typeof orgId !== 'string' || orgId.length === 0) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Forbidden' }, 403),
    }
  }

  return { ok: true, userId: user.id, orgId }
}

export { corsHeaders }
