import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".vercel/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Downgrade `any` usage to warning (requires gradual type refinement)
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade set-state-in-effect to warning (existing codebase patterns)
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
