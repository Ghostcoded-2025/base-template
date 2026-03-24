<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { authAPI, userAPI } from '@/lib/supabase'

const email = ref<string | null>(null)
const fullName = ref<string | null>(null)
const isLoading = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    const { data: authData } = await authAPI.getCurrentUser()
    if (!authData.user) {
      loadError.value = 'Could not load session.'
      return
    }
    email.value = authData.user.email ?? null

    const { data: profile, error: profileErr } = await userAPI.getProfile()
    if (profileErr) {
      loadError.value = profileErr.message || 'Could not load profile.'
      return
    }
    fullName.value = profile?.full_name ?? null
  } catch {
    loadError.value = 'Something went wrong.'
  } finally {
    isLoading.value = false
  }
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
