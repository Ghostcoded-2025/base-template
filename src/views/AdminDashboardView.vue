<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useSessionStore } from '@/stores/session'

interface AdminPageCard {
  to: string
  title: string
  description: string
}

const sessionStore = useSessionStore()
const { isSuperAdmin, rolesLoaded } = storeToRefs(sessionStore)

const isLoading = computed(() => !rolesLoaded.value)

const adminPages = computed((): AdminPageCard[] => {
  const pages: AdminPageCard[] = []

  if (isSuperAdmin.value) {
    pages.push({
      to: '/admin/management',
      title: 'Admin management',
      description: 'Search users and manage role assignments.',
    })
  }

  return pages
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-lg font-medium">
      Admin
    </h1>

    <div
      v-if="isLoading"
      class="mt-6 text-sm text-gray-600"
    >
      Loading…
    </div>

    <template v-else>
      <div
        v-if="adminPages.length > 0"
        class="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <router-link
          v-for="page in adminPages"
          :key="page.to"
          :to="page.to"
          class="rounded border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md"
        >
          <h2 class="font-medium text-gray-900">
            {{ page.title }}
          </h2>
          <p class="mt-1 text-sm text-gray-600">
            {{ page.description }}
          </p>
        </router-link>
      </div>

      <p
        v-else
        class="mt-6 text-sm text-gray-600"
      >
        No admin tools are available for your role.
      </p>

      <router-link
        to="/dashboard"
        class="mt-8 inline-block text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to dashboard
      </router-link>
    </template>
  </div>
</template>
