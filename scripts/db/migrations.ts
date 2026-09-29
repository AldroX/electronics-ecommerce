/// Migration planning helpers shared by `pnpm db:migrate` and its unit tests.
/// Kept free of I/O side effects beyond reading the migrations directory so the
/// idempotency decision can be verified without a database.

import { readFileSync, readdirSync } from 'fs';
import path from 'path';

export interface MigrationFile {
  /** Zero-padded version parsed from the file name, e.g. `004`. */
  version: string;
  /** File name on disk, e.g. `004_add_product_rating_details.sql`. */
  name: string;
  /** Full SQL file contents, executed verbatim. */
  sql: string;
}

export const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase', 'migrations');

/** Read every `.sql` file in the migrations directory, ordered by version. */
export function readMigrations(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => ({
      version: name.slice(0, 3),
      name,
      sql: readFileSync(path.join(dir, name), 'utf8'),
    }))
    .sort((a, b) => a.version.localeCompare(b.version));
}

/**
 * Decide which migrations still have to run against a database.
 *
 * Only versions missing from the ledger are scheduled, in ascending order.
 * Ledger rows without a matching file are ignored, so a migration deleted from
 * the repository can never block the pipeline. This is what makes `db:migrate`
 * safe to re-run: the non-idempotent early migrations are applied once.
 */
export function planMigrations(
  applied: readonly string[],
  migrations: readonly MigrationFile[]
): MigrationFile[] {
  const done = new Set(applied);
  return migrations
    .filter((migration) => !done.has(migration.version))
    .sort((a, b) => a.version.localeCompare(b.version));
}
