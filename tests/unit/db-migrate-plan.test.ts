/// Unit tests for the migration planner.
/// The planner is the idempotency guarantee of `pnpm db:migrate`: it decides
/// which SQL files still have to run against a given database.
/// Run: pnpm test tests/unit/db-migrate-plan.test.ts

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { planMigrations, type MigrationFile } from '../../scripts/db/migrations';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');

/** Mirrors how scripts/migrate.ts reads the migrations directory. */
function readMigrationsFromDisk(): MigrationFile[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((name) => ({
      version: name.slice(0, 3),
      name,
      sql: readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8'),
    }));
}

const fake = (version: string): MigrationFile => ({
  version,
  name: `${version}_change.sql`,
  sql: 'SELECT 1;',
});

describe('planMigrations', () => {
  it('applies only the migrations missing from the ledger, in version order', () => {
    const pending = planMigrations(
      ['001', '002'],
      [fake('001'), fake('002'), fake('003'), fake('004')]
    );
    expect(pending.map((migration) => migration.version)).toEqual(['003', '004']);
  });

  it('is a no-op when the ledger already lists every migration', () => {
    const pending = planMigrations(['001', '002'], [fake('001'), fake('002')]);
    expect(pending).toEqual([]);
  });

  it('applies everything against an empty ledger', () => {
    const pending = planMigrations([], [fake('001'), fake('002')]);
    expect(pending.map((migration) => migration.version)).toEqual(['001', '002']);
  });

  it('ignores ledger rows that have no migration file (no phantom work, no crash)', () => {
    const pending = planMigrations(['001', '999'], [fake('001'), fake('002')]);
    expect(pending.map((migration) => migration.version)).toEqual(['002']);
  });

  it('orders numerically-safe by version, not by filesystem order', () => {
    const pending = planMigrations([], [fake('010'), fake('002'), fake('001')]);
    expect(pending.map((migration) => migration.version)).toEqual(['001', '002', '010']);
  });

  it('targets the rating migration when only 001-003 are recorded', () => {
    const pending = planMigrations(['001', '002', '003'], readMigrationsFromDisk());
    expect(pending.map((migration) => migration.version)).toEqual(['004']);
    expect(pending[0].sql).toMatch(/ADD COLUMN IF NOT EXISTS rating/i);
  });

  it('schedules nothing when the real directory is fully recorded', () => {
    const everyVersion = readMigrationsFromDisk().map((migration) => migration.version);
    expect(planMigrations(everyVersion, readMigrationsFromDisk())).toEqual([]);
  });
});
