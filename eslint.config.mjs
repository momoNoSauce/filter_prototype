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
    // Claude Code's worktrees are full checkouts of this repo. Left in, `npx
    // eslint .` from the root — the documented command — lints every worktree's
    // copy plus its node_modules, which buried the real output under ~24k
    // findings from files that are not this working tree.
    ".claude/**",
  ]),
]);

export default eslintConfig;
