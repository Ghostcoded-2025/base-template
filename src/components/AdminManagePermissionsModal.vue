<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { AdminUserRow } from '@/lib/admin'

const props = defineProps<{
  open: boolean
  user: AdminUserRow | null
  currentUserEmail: string | null
}>()

const emit = defineEmits<{
  close: []
  save: [email: string, roles: string[]]
}>()

const adminChecked = ref(false)
const superAdminChecked = ref(false)

const isSelf = computed(() => {
  if (!props.user?.email || !props.currentUserEmail) {
    return false
  }
  return props.user.email.toLowerCase() === props.currentUserEmail.toLowerCase()
})

watch(
  () => [props.open, props.user] as const,
  ([open, user]) => {
    if (!open || !user) {
      return
    }
    const roles = new Set(user.roles)
    adminChecked.value = roles.has('admin')
    superAdminChecked.value = roles.has('super_admin')
  },
  { immediate: true }
)

function onSuperAdminChange(checked: boolean) {
  superAdminChecked.value = checked
  if (checked) {
    adminChecked.value = true
  }
}

function onAdminChange(checked: boolean) {
  adminChecked.value = checked
  if (!checked) {
    superAdminChecked.value = false
  }
}

function handleClose() {
  emit('close')
}

function handleSave() {
  if (!props.user || isSelf.value) {
    return
  }
  const next: string[] = []
  if (adminChecked.value) {
    next.push('admin')
  }
  if (superAdminChecked.value) {
    next.push('super_admin')
  }
  emit('save', props.user.email, next)
}
</script>

<template>
  <div
    v-if="open && user"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="perm-modal-title"
    @click.self="handleClose"
  >
    <div class="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 shadow-lg">
      <h2
        id="perm-modal-title"
        class="text-base font-medium"
      >
        Manage permissions
      </h2>
      <p class="mt-1 text-sm text-gray-600">
        {{ user.email }}
      </p>

      <div
        v-if="isSelf"
        class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900"
      >
        You cannot change your own roles from here.
      </div>

      <div
        v-else
        class="mt-4 space-y-3"
      >
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="rounded border-gray-300"
            :checked="adminChecked"
            :disabled="isSelf"
            @change="onAdminChange(($event.target as HTMLInputElement).checked)"
          >
          <span>Admin</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="rounded border-gray-300"
            :checked="superAdminChecked"
            :disabled="isSelf"
            @change="onSuperAdminChange(($event.target as HTMLInputElement).checked)"
          >
          <span>Super admin</span>
        </label>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="isSelf"
          @click="handleSave"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
