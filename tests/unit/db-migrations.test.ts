/// Contract tests for the SQL migration files.
/// These assert the *shape* of the migrations, because the migrations are the
/// only artifact that provisions the database: a non-idempotent or destructive
/// statement here silently breaks every clean/CI database.
/// Run: pnpm test tests/unit/db-migrations.test.ts

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');
const RATING_MIGRATION = '004_add_product_rating_details.sql';

const sqlFiles = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort();

function readMigration(file: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
}

/** Executable statements only: drops comments and blank fragments. */
function statements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

describe('migration 004 — product rating and details', () => {
  it('exists, so a clean database can provision the columns', () => {
    expect(existsSync(path.join(MIGRATIONS_DIR, RATING_MIGRATION))).toBe(true);
  });

  it('adds rating as numeric(2,1)', () => {
    const sql = readMigration(RATING_MIGRATION);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS\s+rating\s+NUMERIC\(2,\s*1\)/i);
  });

  it('adds rating_count as an integer', () => {
    const sql = readMigration(RATING_MIGRATION);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS\s+rating_count\s+INT(EGER)?/i);
  });

  it('adds details as jsonb', () => {
    const sql = readMigration(RATING_MIGRATION);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS\s+details\s+JSONB/i);
  });

  it('is re-runnable: every statement is guarded by IF NOT EXISTS', () => {
    const executed = statements(readMigration(RATING_MIGRATION));
    expect(executed.length).toBeGreaterThan(0);
    const unguarded = executed.filter((statement) => !/IF NOT EXISTS/i.test(statement));
    expect(unguarded).toEqual([]);
  });

  it('is additive: it never drops or recreates anything', () => {
    const sql = readMigration(RATING_MIGRATION);
    expect(sql).not.toMatch(/\bDROP\b/i);
    expect(sql).not.toMatch(/CREATE\s+TABLE/i);
    expect(sql).not.toMatch(/TRUNCATE|DELETE\s+FROM/i);
  });
});

describe('migration directory', () => {
  it('numbers every migration with a unique zero-padded version', () => {
    const versions = sqlFiles.map((file) => file.slice(0, 3));
    for (const version of versions) {
      expect(version).toMatch(/^\d{3}$/);
    }
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('keeps the rating migration as the highest version', () => {
    const versions = sqlFiles.map((file) => file.slice(0, 3));
    expect(versions[versions.length - 1]).toBe('004');
  });
});
