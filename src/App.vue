<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { authAPI } from '@/lib/auth'
import { replaceWithDashboardIfOnGuestAuthPath } from '@/router'
import { isRunningAsInstalledPwa } from '@/lib/pwa'
import { useAccountStore } from '@/stores/account'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const accountStore = useAccountStore()
const { isAuthenticated, rolesLoaded, canAccessAdmin } =
  storeToRefs(sessionStore)

const isLoading = ref(true)

const isLoginPage = computed(() => route.path === '/login')
const isRegisterPage = computed(() => route.path === '/register')
const showAdminNav = computed(
  () => rolesLoaded.value && canAccessAdmin.value
)

const showInstallNavLink = ref(!isRunningAsInstalledPwa())

async function bootstrapAuthenticated() {
  await Promise.all([
    accountStore.refreshProfile(),
    sessionStore.loadRoles(),
  ])
}

function clearAuthenticatedState() {
  sessionStore.clear()
  accountStore.clear()
}

async function applyAuthFromUser() {
  const { data, error } = await authAPI.getCurrentUser()
  const user = data.user
  sessionStore.setFromAuthUser(user && !error ? user : null)

  if (sessionStore.isAuthenticated) {
    await bootstrapAuthenticated()
    replaceWithDashboardIfOnGuestAuthPath(router)
  } else {
    clearAuthenticatedState()
  }
}

onMounted(async () => {
  await applyAuthFromUser()
  isLoading.value = false

  const {
    data: { subscription },
  } = authAPI.onAuthStateChange((event, session) => {
    sessionStore.setFromAuthUser(session?.user ?? null)

    if (!session?.user) {
      clearAuthenticatedState()
      return
    }

    if (event === 'TOKEN_REFRESHED') {
      void accountStore.refreshProfile()
      return
    }

    if (event === 'INITIAL_SESSION') {
      return
    }

    void bootstrapAuthenticated().then(() => {
      replaceWithDashboardIfOnGuestAuthPath(router)
    })
  })
  onUnmounted(() => {
    subscription.unsubscribe()
  })
})

const handleSignOut = async () => {
  try {
    const { error } = await authAPI.signOut()
    if (error) throw error
    clearAuthenticatedState()
    void router.push('/')
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
              v-if="showInstallNavLink"
              to="/install-app"
              class="text-gray-600 hover:text-gray-900"
            >
              Install app
            </router-link>
            <router-link
              v-if="showAdminNav"
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
