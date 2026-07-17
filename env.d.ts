/// <reference types="vite/client" />

declare module 'vue-router' {
  interface RouteMeta {
    requiresAdmin?: boolean
    requiresSuperAdmin?: boolean
  }
}

export {}
