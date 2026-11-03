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
    files: ["src/components/**"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "react-hooks/purity": "off",
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/vite-env.d.ts"],
    rules: { "@typescript-eslint/consistent-type-definitions": "off" },
  },
  { files: ["**/*.{js,mjs}"], ...tseslint.configs.disableTypeChecked },
);
