<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { authAPI } from '@/lib/auth'

const router = useRouter()

onMounted(async () => {
  const { data } = await authAPI.getCurrentUser()
  if (data.user) {
    void router.push('/dashboard')
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm space-y-8 text-center">
      <div>
        <h1 class="text-lg font-medium text-gray-900">
          App
        </h1>
        <p class="mt-2 text-sm text-gray-600">
          Starter shell—swap this page in your fork.
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <router-link
          to="/login"
          class="rounded border border-gray-900 bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Sign in
        </router-link>
        <router-link
          to="/register"
          class="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
        >
          Create an account
        </router-link>
      </div>
    </div>
  </div>
</template>
