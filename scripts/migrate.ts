/// ============================================================
/// Apply supabase/migrations/*.sql to a Postgres database.
/// Usage: pnpm db:migrate
///
/// Requires a direct Postgres connection string in DATABASE_URL (the Supabase
/// session pooler works). The Supabase JS client speaks PostgREST, which cannot
/// execute DDL, so this script fails loudly when the string is missing instead
/// of silently skipping the step and reporting a false green.
///
/// Applied versions are recorded in a `schema_migrations` ledger, so the
/// non-idempotent early migrations run exactly once and the whole command is
/// safe to re-run.
/// ============================================================

import { Client } from 'pg';
import dotenv from 'dotenv';
import { planMigrations, readMigrations } from './db/migrations';

dotenv.config({ path: '.env' });

const LEDGER_TABLE = 'schema_migrations';
const LOCK_NAME = 'electronics-ecommerce:migrations';

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is required to run migrations.');
    console.error('   The Supabase JS client cannot execute DDL, so there is no fallback.');
    console.error('   Set it to the Supabase session pooler URL, for example:');
    console.error(
      '   postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres'
    );
    process.exit(1);
  }

  const migrations = readMigrations();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // Serialize concurrent runners (CI job and a local run) behind one lock.
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [LOCK_NAME]);

    await client.query(
      `CREATE TABLE IF NOT EXISTS ${LEDGER_TABLE} (
         version TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    const { rows } = await client.query<{ version: string }>(
      `SELECT version FROM ${LEDGER_TABLE}`
    );
    const pending = planMigrations(
      rows.map((row) => row.version),
      migrations
    );

    if (pending.length === 0) {
      console.log(`✅ Schema up to date — ${migrations.length} migration(s) recorded.`);
      return;
    }

    console.log(
      `📦 Applying ${pending.length} migration(s): ${pending.map((m) => m.version).join(', ')}`
    );

    for (const migration of pending) {
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO ${LEDGER_TABLE} (version) VALUES ($1) ON CONFLICT (version) DO NOTHING`,
          [migration.version]
        );
        await client.query('COMMIT');
        console.log(`   ✅ ${migration.name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`${migration.name} failed: ${(error as Error).message}`);
      }
    }

    console.log('✅ Migrations complete.');
  } finally {
    await client
      .query('SELECT pg_advisory_unlock(hashtext($1))', [LOCK_NAME])
      .catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
