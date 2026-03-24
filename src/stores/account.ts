import { ref } from 'vue'
import { defineStore } from 'pinia'

import { profileAPI } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export const useAccountStore = defineStore('account', () => {
  const profile = ref<Profile | null>(null)
  const profileLoading = ref(false)

  async function refreshProfile() {
    profileLoading.value = true
    try {
      const { data, error } = await profileAPI.getCurrentProfile()
      if (error || !data) {
        profile.value = null
        return
      }
      profile.value = data
    } finally {
      profileLoading.value = false
    }
  }

  /**
   * Updates the signed-in user’s `profiles.full_name` and reloads `profile` from the server.
   */
  async function updateFullName(fullName: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }
    await refreshProfile()
    return data
  }

  function clear() {
    profile.value = null
    profileLoading.value = false
  }

  return {
    profile,
    profileLoading,
    refreshProfile,
    updateFullName,
    clear,
  }
})
