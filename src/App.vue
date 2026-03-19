<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authAPI } from '@/lib/supabase'
import { isClientView, isAppDomain, isOrganizationSubdomain } from '@/utils/domain'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()
const router = useRouter()

const isAuthenticated = ref(false)
const isLoading = ref(true)

const isHomePage = computed(() => route.path === '/')
const isLoginPage = computed(() => route.path === '/login')
const isRegisterPage = computed(() => route.path === '/register')
const isClientViewPage = computed(() => isClientView())
const isOnAppDomain = computed(() => isAppDomain())
const isOnOrgSubdomain = computed(() => isOrganizationSubdomain())

onMounted(async () => {
  try {
    // Only check authentication for admin views, not client views
    if (!isClientViewPage.value) {
      const { user } = await authAPI.getCurrentUser()
      isAuthenticated.value = !!user

      if (isAuthenticated.value) {
        // Redirect authenticated users away from login/register
        if (isLoginPage.value || isRegisterPage.value) {
          router.push('/dashboard')
        }
        // Redirect authenticated users from home to dashboard
        else if (isHomePage.value) {
          router.push('/dashboard')
        }
      } else {
        // Redirect unauthenticated users based on domain
        if (isHomePage.value && !isLoginPage.value && !isRegisterPage.value) {
          if (isOnAppDomain.value) {
            router.push('/register')
          } else if (isOnOrgSubdomain.value) {
            router.push('/login')
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
  } finally {
    isLoading.value = false
  }
})

const handleSignOut = async () => {
  try {
    const { error } = await authAPI.signOut()
    if (error) throw error
    // Redirect based on domain after sign out
    if (isOnAppDomain.value) {
      router.push('/register')
    } else if (isOnOrgSubdomain.value) {
      router.push('/login')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
    <!-- Loading State -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-gray-600 dark:text-white/70">Loading...</p>
      </div>
    </div>

    <!-- Main App Content -->
    <div v-else>
      <!-- Navigation Header -->
      <nav v-if="isAuthenticated && !isLoginPage && !isRegisterPage && !isClientViewPage" class="bg-gray-100 dark:bg-white/80 backdrop-blur-md border-b border-gray-200 dark:border-white/20 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Logo -->
            <div class="flex items-center">
              <router-link to="/dashboard" class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </div>
                <span class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Base Template</span>
              </router-link>
            </div>

            <!-- Navigation Links -->
            <div class="hidden md:flex items-center space-x-6">
              <button
                type="button"
                @click="toggleTheme"
                class="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white transition-colors"
                :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              >
                <!-- Sun (show in dark mode) -->
                <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <!-- Moon (show in light mode) -->
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              </button>
              <router-link
                to="/dashboard"
                class="text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </router-link>
              <button
                @click="handleSignOut"
                class="text-gray-600 hover:text-gray-900 dark:text-white/70 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main>
        <RouterView />
      </main>
    </div>
  </div>
</template>

