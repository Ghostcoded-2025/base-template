import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

import { jsonResponse } from './http.ts'

export async function requireSuperAdmin(
  req: Request
): Promise<
  | { ok: true; userId: string; email: string | undefined }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Missing or invalid authorization' }, 401),
    }
  }
  const token = authHeader.slice(7).trim()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) {
    return { ok: false, response: jsonResponse({ error: 'Server misconfigured' }, 500) }
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser()
  if (error || !user) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) }
  }

  const { data: hasRole, error: rpcError } = await userClient.rpc('current_user_has_role', {
    role_name: 'super_admin',
  })
  if (rpcError || !hasRole) {
    return { ok: false, response: jsonResponse({ error: 'Forbidden' }, 403) }
  }

  return { ok: true, userId: user.id, email: user.email }
}
