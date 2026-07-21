import eslintConfigXo from "eslint-config-xo";
import { defineConfig } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.ts", "**/*.tsx"],
  ignores: ["**/dist/**", "**/node_modules/**", "*.config.js"],
  extends: [
    eslintConfigXo({ prettier: "compat" }),
    perfectionist.configs["recommended-natural"],
  ],
  rules: {
    // Note: you must disable the base rule as it can report incorrect errors
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
  },
});
