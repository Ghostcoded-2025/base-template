import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export const authAPI = {
  async signUp(
    email: string,
    password: string,
    orgId: string,
    fullName?: string,
    emailRedirectTo?: string
  ) {
    const metadata: Record<string, string> = { org_id: orgId }
    const trimmedName = fullName?.trim()
    if (trimmedName) {
      metadata.full_name = trimmedName
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: metadata,
      },
    })
    return { data, error }
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    return supabase.auth.signOut()
  },

  async getCurrentUser() {
    return supabase.auth.getUser()
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
