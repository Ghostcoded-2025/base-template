<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { profileAPI } from '@/lib/profile'

const isSuperAdmin = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    isSuperAdmin.value = await profileAPI.hasRole('super_admin')
  } finally {
    isLoading.value = false
  }
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

    <ul
      v-else
      class="mt-6 list-inside list-disc space-y-2 text-sm"
    >
      <li v-if="isSuperAdmin">
        <router-link
          to="/admin/admin-management"
          class="text-indigo-600 hover:text-indigo-800"
        >
          Admin management
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
