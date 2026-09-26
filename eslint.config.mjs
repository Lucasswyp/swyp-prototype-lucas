import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Native Xcode project + its build output — not web source, never meant
    // to be linted by this config (the "build/**" pattern above is anchored
    // to the repo root, so it doesn't already cover ios/build/**).
    "ios/**",
  ]),
]);

export default eslintConfig;
