import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { RouteRecordRaw } from 'vue-router'

import { resolveIncludedSsgRoutes } from './src/lib/ssg-routes'

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [vue()]

  // Only enable devtools in dev mode to avoid localStorage errors during build
  if (command === 'serve') {
    try {
      const vueDevTools = (await import('vite-plugin-vue-devtools')).default
      plugins.push(vueDevTools())
    } catch {
      // Devtools not available, continue without it
    }
  }

  return {
    plugins,
    server: {
      port: 5173,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      includedRoutes(paths: string[], routes: readonly RouteRecordRaw[]) {
        return resolveIncludedSsgRoutes(paths, routes)
      },
    },
  }
})
