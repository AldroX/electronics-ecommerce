# electronics-ecommerce

Astro 7 electronics e-commerce site. Early stage — starter template, no frameworks integrated yet.

## Runtime

- **Node >=22.12.0** (enforced in `package.json` engines)
- **pnpm** — do not use npm or yarn
- **Astro 7.2.7** — current version

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build to `./dist/` |
| `pnpm preview` | Preview the built site locally |
| `pnpm astro check` | Type checking (Astro's built-in) |

**No linting, formatting, or test framework is installed.** Do not run `eslint`, `prettier`, `vitest`, or similar — they will fail. If validation is needed, `pnpm astro check` is the only available step.

## TypeScript

Extends `astro/tsconfigs/strict`. Auto-generated types live in `.astro/types.d.ts` — do not hand-edit.

## Project structure

```
src/
  pages/          → routes (index.astro is the only page)
  components/     → .astro components (Welcome.astro)
  layouts/        → Layout.astro (HTML shell)
  assets/         → images/SVGs imported in components
public/           → static assets served as-is
```

## pnpm quirks

`pnpm-workspace.yaml` explicitly allows builds for `esbuild` and `sharp`. The `allowScripts` field in `package.json` mirrors the esbuild entry. Do not remove these without understanding the pnpm build-allowlist behavior.

`astro@7.2.7` is excluded from `minimumReleaseAge` — this is intentional for the current version pin.

## Gotchas

- Astro components use the `.astro` extension and frontmatter fences (`---`). They are not JSX.
- Assets imported in frontmatter use `.src` (e.g., `import img from './file.svg'; <img src={img.src} />`).
- The `dist/` output directory is gitignored and gitignored by default.
