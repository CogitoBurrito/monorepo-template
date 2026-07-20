import eslintConfigXo from "eslint-config-xo";
import { defineConfig } from "eslint/config";
import perfectionist from "eslint-plugin-perfectionist";

export default defineConfig([
  {
    plugins: {
      perfectionist,
    },
    rules: {
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          order: "asc",
        },
      ],
    },
  },
  ...eslintConfigXo(),
]);
