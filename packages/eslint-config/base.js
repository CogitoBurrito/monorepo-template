import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";
import unicorn from 'eslint-plugin-unicorn';
import { defineConfig } from "eslint/config";
import js from '@eslint/js';
import { importX } from 'eslint-plugin-import-x'
import tsParser from '@typescript-eslint/parser'
import regexpPlugin from "eslint-plugin-regexp"
import vitest from '@vitest/eslint-plugin'

export default defineConfig(
  {
    ignores: ["**/routeTree.gen.ts", "**/dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      unicorn,
      'import-x': importX,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
      perfectionist.configs['recommended-natural'],
      'unicorn/recommended',
      'import-x/flat/recommended',
      regexpPlugin.configs.recommended,

    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },

    // Custom rule overrides (modify rule levels or disable rules)
    rules: {
      "import-x/order": "off",
      "unicorn/consistent-class-member-order": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "no-restricted-syntax": [
        "error",
        {
          selector: "FunctionDeclaration FunctionDeclaration",
          message:
            "Nested functions must be declared as arrow function expressions (e.g., `const fn = () => {}`).",
        },
      ],
      "no-inner-declarations": ["error", "functions"],
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          "allow": [
            {
              "from": "package",
              "package": "@tanstack/router-core",
              "name": "Redirect"
            },
            {
              "from": "package",
              "package": "@tanstack/router-core",
              "name": "NotFoundError"
            }
          ]
        }
      ]
    },
  },
  {
    files: ['tests/**'], // or any other pattern
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
);
