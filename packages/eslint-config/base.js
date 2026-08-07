import eslintConfigXo from "eslint-config-xo";
import { defineConfig } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...eslintConfigXo({ prettier: "compat" }),
  {
    files: ["**/*.{js,ts}"],
    ignores: ["**/dist/**", "**/node_modules/**", "*.config.js"],
    extends: [perfectionist.configs["recommended-natural"]],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: /^_/.source,
          caughtErrors: "all",
          caughtErrorsIgnorePattern: /^_$/.source,
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "FunctionDeclaration FunctionDeclaration",
          message:
            "Nested functions must be declared as arrow function expressions (e.g., `const fn = () => {}`).",
        },
      ],
      "no-inner-declarations": ["error", "functions"],
    },
    languageOptions: {
      // Use TypeScript ESLint parser for TypeScript files
      parser: tseslint.parser,
      parserOptions: {
        // Enable project service for better TypeScript integration
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
