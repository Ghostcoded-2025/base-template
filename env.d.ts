/// <reference types="vite/client" />

export {}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAdmin?: boolean
    requiresSuperAdmin?: boolean
  }
}
