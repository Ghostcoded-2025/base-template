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
}
