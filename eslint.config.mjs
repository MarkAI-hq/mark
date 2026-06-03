import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ── Ignore generated / vendor output ───────────────────────────────────
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      '*.config.js',
      '*.config.mjs',
      'src/components/ui/**', // shadcn generated components
    ],
  },

  // ── Next.js recommended (includes TypeScript parser + React rules) ──────
  ...compat.extends('next/core-web-vitals'),

  // ── Source files ────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Disable all Prettier-conflicting formatting rules
      ...prettierConfig.rules,

      // Logic / correctness
      'no-debugger':    'error',
      'no-console':     ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off', // TypeScript's noUnusedLocals handles this
      'no-undef':       'off', // TypeScript handles this
    },
  },
];
