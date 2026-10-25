import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'test-results'] },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/unit/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Intentional: autofocus moves focus into dialogs and the join form.
      'jsx-a11y/no-autofocus': 'off',
      // Labels here wrap their control with the text in nested spans.
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', depth: 4 }],
    },
  },
  {
    files: ['server/**/*.mjs', 'tests/e2e/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
