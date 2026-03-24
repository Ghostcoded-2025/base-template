<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { profileAPI } from '@/lib/profile'
import { authAPI, supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const isAuthenticated = ref(false)
const isLoading = ref(true)
const isAdminUser = ref(false)

const isLoginPage = computed(() => route.path === '/login')
const isRegisterPage = computed(() => route.path === '/register')

async function refreshSessionAndRoles() {
  try {
    const { data, error } = await authAPI.getCurrentUser()
    const user = data.user
    isAuthenticated.value = !!user && !error

    if (isAuthenticated.value) {
      const [adminRole, superRole] = await Promise.all([
        profileAPI.hasRole('admin'),
        profileAPI.hasRole('super_admin'),
      ])
      isAdminUser.value = adminRole || superRole
    } else {
      isAdminUser.value = false
    }

    if (isAuthenticated.value && (isLoginPage.value || isRegisterPage.value)) {
      void router.push('/dashboard')
    }
  } catch (e) {
    console.error('Error checking authentication:', e)
    isAdminUser.value = false
  }
}

onMounted(async () => {
  await refreshSessionAndRoles()
  isLoading.value = false

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(() => {
    void refreshSessionAndRoles()
  })
  onUnmounted(() => {
    subscription.unsubscribe()
  })
})

const handleSignOut = async () => {
  try {
    const { error } = await authAPI.signOut()
    if (error) throw error
    void router.push('/login')
  } catch (e) {
    console.error('Error signing out:', e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <div
      v-if="isLoading"
      class="min-h-screen flex items-center justify-center"
    >
      <p class="text-sm text-gray-600">
        Loading…
      </p>
    </div>

    <div v-else>
      <nav
        v-if="isAuthenticated && !isLoginPage && !isRegisterPage"
        class="border-b border-gray-200 bg-white"
      >
        <div class="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <router-link
            to="/dashboard"
            class="text-sm font-medium"
          >
            App
          </router-link>
          <div class="flex items-center gap-4 text-sm">
            <router-link
              to="/dashboard"
              class="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </router-link>
            <router-link
              v-if="isAdminUser"
              to="/admin"
              class="text-gray-600 hover:text-gray-900"
            >
              Admin
            </router-link>
            <button
              type="button"
              class="text-gray-600 hover:text-gray-900"
              @click="handleSignOut"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main>
        <RouterView />
      </main>
    </div>
  </div>
</template>
