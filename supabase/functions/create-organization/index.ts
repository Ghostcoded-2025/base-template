import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

import { corsHeaders, jsonResponse } from '../_shared/http.ts'
import { requireSuperAdmin } from '../_shared/require-super-admin.ts'

type CreateBody = {
  name?: string
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

  let body: CreateBody
  try {
    body = (await req.json()) as CreateBody
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return jsonResponse({ error: 'name is required' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500)
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await service
    .from('organizations')
    .insert({ name })
    .select('id, name, storage_bucket_id')
    .single()

  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return jsonResponse({ error: error.message }, status)
  }

  return jsonResponse({
    id: data.id,
    name: data.name,
    storage_bucket_id: data.storage_bucket_id,
  })
})
