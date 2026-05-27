<template>
  <div class="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
    <div class="mx-auto w-full max-w-sm space-y-8 text-center">
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
