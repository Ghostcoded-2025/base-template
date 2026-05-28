<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { adminAPI } from '@/lib/admin'
import { organizationsAPI, type OrganizationOption } from '@/lib/organizations'

const name = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref('')
const organizations = ref<OrganizationOption[]>([])

async function loadOrganizations() {
  const { data, error: listError } = await organizationsAPI.listForSignup()
  if (listError) {
    error.value = listError.message
    return
  }
  organizations.value = data
}

onMounted(() => {
  void loadOrganizations()
})

const handleCreate = async () => {
  isLoading.value = true
  error.value = ''
  success.value = ''

  const trimmedName = name.value.trim()
  if (!trimmedName) {
    error.value = 'Organization name is required.'
    isLoading.value = false
    return
  }

  try {
    const created = await adminAPI.createOrganization(trimmedName)
    success.value = `Created “${created.name}”.`
    name.value = ''
    await loadOrganizations()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <h1 class="text-lg font-medium">
      Create organization
    </h1>
    <p class="mt-1 text-sm text-gray-600">
      Platform super admins only. New orgs receive default admin and staff roles.
    </p>

    <form
      class="mt-6 space-y-4"
      @submit.prevent="handleCreate"
    >
      <div>
        <label
          for="org-name"
          class="block text-sm text-gray-700"
        >Name</label>
        <input
          id="org-name"
          v-model="name"
          type="text"
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
      <p
        v-if="success"
        class="text-sm text-green-700"
      >
        {{ success }}
      </p>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full rounded border border-gray-900 bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {{ isLoading ? 'Creating…' : 'Create organization' }}
      </button>
    </form>

    <div
      v-if="organizations.length > 0"
      class="mt-10"
    >
      <h2 class="text-sm font-medium text-gray-900">
        Organizations
      </h2>
      <ul class="mt-2 space-y-1 text-sm text-gray-700">
        <li
          v-for="org in organizations"
          :key="org.id"
        >
          {{ org.name }}
        </li>
      </ul>
    </div>

    <p class="mt-8">
      <router-link
        to="/admin"
        class="text-sm text-gray-600 underline"
      >
        Back to admin
      </router-link>
    </p>
  </div>
</template>
