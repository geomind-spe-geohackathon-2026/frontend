import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      ".tmp",
      "public",
      "playwright-report",
      "test-results",
      "src/shared/api/schema.d.ts",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: { allowDefaultProject: ["eslint.config.js", "scripts/*.mjs"] },
      },
    },
    rules: {
      "max-depth": ["error", 3],
      "no-alert": "error",
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: false }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**", "tests/**"],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: ["src/vite-env.d.ts"],
    rules: { "@typescript-eslint/consistent-type-definitions": "off" },
  },
  { files: ["**/*.{js,mjs}"], ...tseslint.configs.disableTypeChecked },
);
