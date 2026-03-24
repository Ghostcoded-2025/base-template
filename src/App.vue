<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authAPI } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const isAuthenticated = ref(false)
const isLoading = ref(true)

const isLoginPage = computed(() => route.path === '/login')
const isRegisterPage = computed(() => route.path === '/register')

onMounted(async () => {
  try {
    const { data, error } = await authAPI.getCurrentUser()
    const user = data.user
    isAuthenticated.value = !!user && !error

    if (isAuthenticated.value && (isLoginPage.value || isRegisterPage.value)) {
      void router.push('/dashboard')
    }
  } catch (e) {
    console.error('Error checking authentication:', e)
  } finally {
    isLoading.value = false
  }
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
