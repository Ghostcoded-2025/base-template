<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '@/lib/auth'

const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const isLoading = ref(false)
const error = ref('')
const isSignupSuccess = ref(false)

onMounted(async () => {
  const { data } = await authAPI.getCurrentUser()
  if (data.user) {
    void router.push('/dashboard')
  }
})

const handleRegister = async () => {
  isLoading.value = true
  error.value = ''

  try {
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match.'
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : undefined
    const { error: authError } = await authAPI.signUp(email.value, password.value, {
      fullName: fullName.value.trim() || undefined,
      emailRedirectTo: origin ? `${origin}/dashboard` : undefined,
    })

    if (authError) {
      error.value = authError.message
      return
    }

    isSignupSuccess.value = true
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
        <h1 class="text-lg font-medium">
          Create account
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Sign up with email and password.
        </p>
      </div>

      <div
        v-if="isSignupSuccess"
        class="space-y-4 rounded border border-gray-200 bg-white p-4 text-sm text-gray-700"
      >
        <p>Check your email to confirm your account if confirmation is enabled in Supabase.</p>
        <router-link
          to="/login"
          class="text-gray-900 underline"
        >
          Back to sign in
        </router-link>
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="handleRegister"
      >
        <div>
          <label
            for="fullName"
            class="block text-sm text-gray-700"
          >Name (optional)</label>
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            name="fullName"
            autocomplete="name"
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
        </div>
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
            autocomplete="new-password"
            required
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
        </div>
        <div>
          <label
            for="confirmPassword"
            class="block text-sm text-gray-700"
          >Confirm password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            name="confirmPassword"
            autocomplete="new-password"
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
          {{ isLoading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p
        v-if="!isSignupSuccess"
        class="text-center text-sm text-gray-600"
      >
        <router-link
          to="/login"
          class="underline"
        >
          Already have an account?
        </router-link>
      </p>
    </div>
  </div>
</template>
