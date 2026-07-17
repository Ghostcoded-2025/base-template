<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSeoMeta } from '@unhead/vue'
import { computed } from 'vue'

import { SEO_DEFAULTS, SEO_SITE_NAME } from '@/lib/seo'
import { useAccountStore } from '@/stores/account'
import { useSessionStore } from '@/stores/session'

useSeoMeta({
  title: `Dashboard · ${SEO_SITE_NAME}`,
  description: 'Your account dashboard.',
  ogTitle: `Dashboard · ${SEO_SITE_NAME}`,
  ogDescription: 'Your account dashboard.',
  ogImage: SEO_DEFAULTS.ogImage,
  twitterCard: SEO_DEFAULTS.twitterCard,
})

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
