import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022, // ✅ enables import assertions
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    plugins: {
      js
    },
    rules: {
      ...js.configs.recommended.rules
    }
  },
  {
    ignores: ['node_modules', 'dist', 'build']
  }
])
