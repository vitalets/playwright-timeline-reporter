/** Configures ESLint for TypeScript source, React UI code, and repo scripts/tests. */
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import visualComplexity from 'eslint-plugin-visual-complexity';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

const reactHooksRecommendedRules = {
  'react-hooks/rules-of-hooks': reactHooks.configs.recommended.rules['react-hooks/rules-of-hooks'],
  'react-hooks/exhaustive-deps':
    reactHooks.configs.recommended.rules['react-hooks/exhaustive-deps'],
};

export default defineConfig(
  includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  // all files rules
  {
    files: [
      'src/**/*.ts',
      'src/test-timings/**/*.ts',
      'src/utils/**/*.ts',
      'scripts/**/*.ts',
      'test/**/*.ts',
      'example/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'error',
    },
  },
  // report files rules
  {
    files: ['src/report/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // *.tsx files rules
  {
    files: ['**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooksRecommendedRules,
  },
  // complexity rules
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      visual: visualComplexity,
    },
    rules: {
      complexity: 0,
      'visual/complexity': ['error', { max: 5 }],
      'max-depth': ['error', { max: 3 }],
      'max-nested-callbacks': ['error', { max: 3 }],
      'max-params': ['error', { max: 4 }],
      'max-statements': ['error', { max: 15 }, { ignoreTopLevelFunctions: false }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-len': ['error', { code: 120, ignoreUrls: true, ignorePattern: 'd="([\\s\\S]*?)"' }],
      'max-lines': ['error', { max: 300, skipComments: true, skipBlankLines: true }],
    },
  },
  // test and example test files rules
  {
    files: ['test/**/*.ts', 'example/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty-pattern': 'off',
    },
  },
);
