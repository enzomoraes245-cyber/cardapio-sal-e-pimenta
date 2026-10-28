import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const NODE_FILES = ['*.js', 'backend/**/*.js', 'frontend/*.js'];
const FRONTEND_FILES = ['frontend/src/**/*.{js,jsx}', 'frontend/tests/**/*.{js,jsx}'];

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'backend/storage/**'],
  },
  js.configs.recommended,
  {
    files: NODE_FILES,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    files: FRONTEND_FILES,
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  prettier,
];
