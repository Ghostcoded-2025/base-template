import { supabase } from '@/lib/supabase'

export interface OrganizationOption {
  id: string
  name: string
}

export const organizationsAPI = {
  async listForSignup(): Promise<{
    data: OrganizationOption[]
    error: Error | null
  }> {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')

    return {
      data: data ?? [],
      error: error as Error | null,
    }
  },
}
