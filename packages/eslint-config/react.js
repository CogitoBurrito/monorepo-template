import eslintReact from "@eslint-react/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintPluginReactImport from "eslint-plugin-react-import";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig({
  files: ["**/use*.ts", "**/*.tsx"],
  ignores: ["**/dist/**", "**/node_modules/**", "*.config.js"],
  // Extend recommended rule sets from:
  // 1. ESLint JS's recommended rules
  // 2. TypeScript ESLint recommended rules
  // 3. ESLint React's recommended-typescript rules
  extends: [
    reactHooks.configs.flat["recommended-latest"],
    eslintReact.configs["recommended-type-checked"],
    eslintReact.configs["disable-conflict-eslint-plugin-react-hooks"],
    eslintPluginReactImport.configs.recommended,
  ],
  // Configure language/parsing options
  languageOptions: {
    // Use TypeScript ESLint parser for TypeScript files
    parser: tseslint.parser,
    parserOptions: {
      // Enable project service for better TypeScript integration
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
