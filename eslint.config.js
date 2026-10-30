import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const NODE_FILES = ['*.js', 'backend/**/*.js', 'frontend/*.js', 'scripts/**/*.js'];
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
  {
    // O cardápio público (e o que ele importa) nunca depende da interface administrativa:
    // o design das áreas administrativas não pode alcançá-lo, nem por componente compartilhado.
    files: [
      'frontend/src/features/menu/**/*.{js,jsx}',
      'frontend/src/layouts/PublicMenuLayout.jsx',
      'frontend/src/components/ui/**/*.{js,jsx}',
      'frontend/src/components/shared/**/*.{js,jsx}',
      'frontend/src/app/router.jsx',
      'frontend/src/main.jsx',
      'frontend/src/services/api.js',
      'frontend/src/utils/format-currency.js',
      'frontend/src/features/customization/utils/brand-style.js',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/components/admin/**',
                '**/layouts/Admin*',
                '**/layouts/Backoffice*',
                '**/features/platform/**',
              ],
              message: 'O cardápio público não pode depender da interface administrativa.',
            },
          ],
        },
      ],
    },
  },
  prettier,
];
