/// Minimal ESLint Flat Config
/// Run: pnpm lint / pnpm lint:fix

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".astro/**",
      "*.config.js",
      "*.config.mjs",
      "scripts/*.ts",
    ],
  },
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-duplicate-imports": "error",
      "no-unused-expressions": ["error", { allowShortCircuit: true, allowTernary: true }],
    },
  },
];