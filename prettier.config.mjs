/// Prettier Config for Astro + TypeScript + Tailwind
/// Run: pnpm format / pnpm format:check

export default {
  plugins: ["prettier-plugin-astro"],
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  proseWrap: "never",
  htmlWhitespaceSensitivity: "css",

  // Override for specific file types
  overrides: [
    {
      files: ["*.astro"],
      options: {
        parser: "astro",
        printWidth: 120,
      },
    },
    {
      files: ["*.json", "*.jsonc"],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ["*.css", "*.scss"],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ["*.md", "*.mdx"],
      options: {
        proseWrap: "always",
        printWidth: 80,
      },
    },
  ],
};