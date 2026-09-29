/// Guard tests for the CI workflow.
/// `secrets.PUBLIC_SUPABASE_*` point at the live project, so a migrate/seed step
/// that runs on pull_request would let any PR mutate production. These tests
/// pin that boundary, because nothing else in the suite can see a YAML file.
/// Run: pnpm test tests/unit/ci-workflow.test.ts

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const workflow = readFileSync(
  path.resolve(process.cwd(), '.github', 'workflows', 'ci.yml'),
  'utf8'
);

const buildJob = workflow.slice(
  workflow.indexOf('\n  build:'),
  workflow.indexOf('\n  # ===', workflow.indexOf('\n  build:'))
);

/** The body of the first step whose `- name:` matches. */
function stepNamed(name: string): string {
  const start = buildJob.indexOf(`- name: ${name}`);
  if (start === -1) return '';
  const rest = buildJob.slice(start);
  const next = rest.indexOf('\n      - name:', 1);
  return next === -1 ? rest : rest.slice(0, next);
}

describe('build job', () => {
  it('migrates and seeds the database before building', () => {
    const step = stepNamed('Migrate and seed the database');
    expect(step).toContain('pnpm db:migrate');
    expect(step).toContain('pnpm db:seed');
    expect(buildJob.indexOf('- name: Migrate and seed the database')).toBeLessThan(
      buildJob.indexOf('- name: Build Astro project')
    );
  });

  it('never runs the migrate/seed step on a pull request', () => {
    const step = stepNamed('Migrate and seed the database');
    expect(step).toContain("github.event_name == 'push'");
    expect(step).toContain("github.ref == 'refs/heads/main'");
  });

  it('passes the database credentials the scripts require', () => {
    const step = stepNamed('Migrate and seed the database');
    expect(step).toContain('secrets.SUPABASE_DB_URL');
    expect(step).toContain('secrets.SUPABASE_SERVICE_ROLE_KEY');
  });
});
