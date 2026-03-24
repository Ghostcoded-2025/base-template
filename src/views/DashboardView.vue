<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useAccountStore } from '@/stores/account'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const accountStore = useAccountStore()
const { authUser } = storeToRefs(sessionStore)
const { profile, profileLoading } = storeToRefs(accountStore)

const email = computed(() => authUser.value?.email ?? null)
const fullName = computed(() => profile.value?.full_name ?? null)

const isLoading = computed(() => profileLoading.value)

const loadError = computed(() => {
  if (profileLoading.value) {
    return ''
  }
  if (!sessionStore.isAuthenticated) {
    return 'Could not load session.'
  }
  if (!profile.value) {
    return 'Could not load profile.'
  }
  return ''
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-lg font-medium">
      Dashboard
    </h1>

    <div
      v-if="isLoading"
      class="mt-6 text-sm text-gray-600"
    >
      Loading…
    </div>

    <div
      v-else-if="loadError"
      class="mt-6 text-sm text-red-600"
    >
      {{ loadError }}
    </div>

    <dl
      v-else
      class="mt-6 space-y-2 text-sm"
    >
      <div v-if="email">
        <dt class="text-gray-600">
          Email
        </dt>
        <dd>{{ email }}</dd>
      </div>
      <div v-if="fullName">
        <dt class="text-gray-600">
          Name
        </dt>
        <dd>{{ fullName }}</dd>
      </div>
    </dl>
  </div>
</template>
