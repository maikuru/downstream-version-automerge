import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([
  globalIgnores([
    '**/logs',
    '**/*.log',
    '**/npm-debug.log*',
    '**/yarn-debug.log*',
    '**/yarn-error.log*',
    '**/lerna-debug.log*',
    '**/report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
    '**/pids',
    '**/*.pid',
    '**/*.seed',
    '**/*.pid.lock',
    '**/lib-cov'
  ]),
  {
    extends: compat.extends('airbnb', 'prettier'),

    plugins: {
      prettier
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },

    rules: {
      'prettier/prettier': [
        'error',
        {
          trailingComma: 'none',
          semi: false,
          singleQuote: true,
          printWidth: 120,
          tabWidth: 2,
          useTabs: false,
          endOfLine: 'auto',
          arrowParens: 'avoid',
          proseWrap: 'always',
          htmlWhitespaceSensitivity: 'strict',
          bracketSpacing: true,
          insertPragma: false,
          requirePragma: false,
          quoteProps: 'as-needed'
        }
      ]
    }
  }
])
