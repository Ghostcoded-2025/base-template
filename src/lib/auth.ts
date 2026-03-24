import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export const authAPI = {
  async signUp(
    email: string,
    password: string,
    options?: { fullName?: string; emailRedirectTo?: string }
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: options?.emailRedirectTo,
        ...(options?.fullName
          ? { data: { full_name: options.fullName } }
          : {}),
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
