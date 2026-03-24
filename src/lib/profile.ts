import type { Profile } from '@/types/database'

import { supabase } from '@/lib/supabase'

export const profileAPI = {
  async hasRole(roleName: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('current_user_has_role', {
      role_name: roleName,
    })
    if (error) {
      console.error(error)
      return false
    }
    return data
  },

  async getCurrentProfile(): Promise<{
    data: Profile | null
    error: Error | null
  }> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: userError ?? new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    return {
      data,
      error: error as Error | null,
    }
  },

  async updateFullName(fullName: string): Promise<{
    data: Profile | null
    error: Error | null
  }> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: userError ?? new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
      .select()
      .single()

    return {
      data,
      error: error as Error | null,
    }
  },
}
