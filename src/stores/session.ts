import type { User } from '@supabase/supabase-js'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { profileAPI } from '@/lib/profile'

export interface AuthUserSnapshot { id: string; email: string | null }

export const useSessionStore = defineStore('session', () => {
  const isAuthenticated = ref(false)
  const authUser = ref<AuthUserSnapshot | null>(null)
  const isAdmin = ref(false)
  const isSuperAdmin = ref(false)
  const rolesLoaded = ref(false)

  const canAccessAdmin = computed(
    () => isAdmin.value || isSuperAdmin.value
  )

  function setFromAuthUser(user: User | null) {
    if (!user) {
      isAuthenticated.value = false
      authUser.value = null
      isAdmin.value = false
      isSuperAdmin.value = false
      rolesLoaded.value = false
      return
    }
    isAuthenticated.value = true
    authUser.value = {
      id: user.id,
      email: user.email ?? null,
    }
  }

  async function loadRoles() {
    if (!isAuthenticated.value) {
      isAdmin.value = false
      isSuperAdmin.value = false
      rolesLoaded.value = true
      return
    }
    rolesLoaded.value = false
    const [adminRole, superRole] = await Promise.all([
      profileAPI.hasRole('admin'),
      profileAPI.hasRole('super_admin'),
    ])
    isAdmin.value = adminRole
    isSuperAdmin.value = superRole
    rolesLoaded.value = true
  }

  function clear() {
    isAuthenticated.value = false
    authUser.value = null
    isAdmin.value = false
    isSuperAdmin.value = false
    rolesLoaded.value = false
  }

  return {
    isAuthenticated,
    authUser,
    isAdmin,
    isSuperAdmin,
    rolesLoaded,
    canAccessAdmin,
    setFromAuthUser,
    loadRoles,
    clear,
  }
})
