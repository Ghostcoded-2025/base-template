<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const { isSuperAdmin, rolesLoaded } = storeToRefs(sessionStore)

const isLoading = computed(() => !rolesLoaded.value)
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

    <ul
      v-else
      class="mt-6 list-inside list-disc space-y-2 text-sm"
    >
      <li>
        <router-link
          to="/admin/management"
          class="text-indigo-600 hover:text-indigo-800"
        >
          Admin management
        </router-link>
      </li>
      <li v-if="isSuperAdmin">
        <router-link
          to="/admin/organizations"
          class="text-indigo-600 hover:text-indigo-800"
        >
          Create organization
        </router-link>
      </li>
      <li>
        <router-link
          to="/dashboard"
          class="text-gray-600 hover:text-gray-900"
        >
          Back to dashboard
        </router-link>
      </li>
    </ul>
  </div>
</template>
