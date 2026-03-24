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

  {
    name: 'app/consistent-type-imports',
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  // Keep `paths` allowlist aligned with docs/architecture.md (Supabase client boundary).
  {
    name: 'app/restrict-supabase-client-import',
    files: ['src/**/*.{ts,vue}'],
    ignores: [
      'src/lib/supabase.ts',
      'src/lib/auth.ts',
      'src/lib/profile.ts',
      'src/lib/admin.ts',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/supabase',
              message:
                'Import the Supabase client only from integration modules in src/lib/ (see docs/architecture.md).',
            },
          ],
        },
      ],
    },
  },
)
