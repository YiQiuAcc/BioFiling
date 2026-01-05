import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default [
  {
    name: 'app/files-to-lint',
    files: ['src/**/*.{ts,tsx,vue}'],
    ignores: [
      '**/dist/**',
      '**/dist-server/**',
      '**/node_modules/**',
      '**/.env*',
      '!**/.env.example',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.min.css',
    ],

    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      vue: pluginVue,
    },

    rules: {
      // 在这里添加自定义规则
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_'
        }
      ]
    },
  },

  ...defineConfigWithVueTs(
    vueTsConfigs.recommended,
  ),

  {
    name: 'server/files-to-lint',
    files: ['src/server/**/*.{ts,mts,tsx}'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: './tsconfig.server.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      // 服务器端特定规则
      'no-console': 'off', // 服务器允许使用 console
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_'
        }
      ]
    },
  },

  skipFormatting,
]
