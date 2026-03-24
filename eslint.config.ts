import { globalIgnores } from 'eslint/config'
import {
  configureVueProject,
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

// Keeps type-aware `no-unsafe-*` rules practical for Vue (createApp, router, etc.).
// Set `allowComponentTypeUnsafety: false` if you want those rules fully strict.
configureVueProject({ rootDir: import.meta.dirname })

export default defineConfigWithVueTs(
  {
    name: 'app/linter-options',
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/src/types/supabase.ts',
    '**/supabase/functions/**',
  ]),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,
  vueTsConfigs.stylisticTypeChecked,
)
