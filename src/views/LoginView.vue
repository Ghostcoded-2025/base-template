<script setup lang="ts">
import { useSeoMeta } from '@unhead/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '@/lib/auth'
import { SEO_DEFAULTS, SEO_SITE_NAME } from '@/lib/seo'

useSeoMeta({
  title: `Sign in · ${SEO_SITE_NAME}`,
  description: 'Sign in with your email and password.',
  ogTitle: `Sign in · ${SEO_SITE_NAME}`,
  ogDescription: 'Sign in with your email and password.',
  ogImage: SEO_DEFAULTS.ogImage,
  twitterCard: SEO_DEFAULTS.twitterCard,
})

const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const { error: authError } = await authAPI.signIn(email.value, password.value)
    if (authError) {
      error.value = authError.message
      return
    }
    void router.push('/dashboard')
  } catch {
    error.value = 'Something went wrong.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm space-y-6">
      <div>
        <h1 class="flex items-center gap-2 text-lg font-medium">
          <FontAwesomeIcon
            icon="right-to-bracket"
            class="text-gray-700"
            aria-hidden="true"
          />
          Sign in
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Use the email and password for your account.
        </p>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="handleLogin"
      >
        <div>
          <label
            for="email"
            class="block text-sm text-gray-700"
          >Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
        </div>
        <div>
          <label
            for="password"
            class="block text-sm text-gray-700"
          >Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
        </div>

        <p
          v-if="error"
          class="text-sm text-red-600"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full rounded border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {{ isLoading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600">
        <router-link
          to="/register"
          class="underline"
        >
          Create an account
        </router-link>
      </p>
    </div>
  </div>
</template>
