import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationFile {
  prefix: string;
  name: string;
  upPath: string;
  downPath: string;
}

function getDatabaseUri(databaseUri?: string): string {
  const uri = databaseUri || process.env['WRITE_DATABASE_URI'] || '';
  if (!uri) {
    throw new Error(
      'Database URI must be provided or WRITE_DATABASE_URI must be set'
    );
  }
  return uri;
}

function parseMigrationFileName(filename: string): {
  prefix: string;
  name: string;
  direction: 'up' | 'down';
} | null {
  const match = filename.match(/^(\d+)_(.+)\.(up|down)\.sql$/);
  if (!match) {
    return null;
  }

  return {
    prefix: match[1]!,
    name: match[2]!,
    direction: match[3] as 'up' | 'down',
  };
}

function compareMigrationPrefix(a: string, b: string): number {
  const diff = BigInt(a) - BigInt(b);
  if (diff < 0n) {
    return -1;
  }
  if (diff > 0n) {
    return 1;
  }
  return a.localeCompare(b);
}

function buildVersion(migration: Pick<MigrationFile, 'prefix' | 'name'>): string {
  return `${migration.prefix}_${migration.name}`;
}

async function getMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = join(__dirname, 'migrations');
  const files = await readdir(migrationsDir);

  const migrations = new Map<string, Partial<MigrationFile>>();

  for (const file of files) {
    const parsed = parseMigrationFileName(file);
    if (!parsed) {
      continue;
    }

    const existing = migrations.get(parsed.prefix);
    if (!existing) {
      migrations.set(parsed.prefix, {
        prefix: parsed.prefix,
        name: parsed.name,
      });
    }

    const migration = migrations.get(parsed.prefix)!;
    const filePath = join(migrationsDir, file);

    if (parsed.direction === 'up') {
      migration.upPath = filePath;
    } else {
      migration.downPath = filePath;
    }
  }

  return Array.from(migrations.values())
    .filter((m): m is MigrationFile => !!(m.upPath && m.downPath))
    .sort((a, b) => compareMigrationPrefix(a.prefix, b.prefix));
}

async function ensureMigrationsTable(
  db: ReturnType<typeof drizzle>
): Promise<void> {
  await db.execute(
    sql.raw(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  );
}

export async function getAppliedMigrations(
  db: ReturnType<typeof drizzle>
): Promise<Set<string>> {
  const result = await db.execute(
    sql.raw('SELECT version FROM schema_migrations ORDER BY version')
  );
  const rows = (result as unknown as { rows: Array<{ version: string }> }).rows;
  return new Set(rows.map((row) => row.version));
}

async function recordMigration(
  db: ReturnType<typeof drizzle>,
  version: string
): Promise<void> {
  await db.execute(sql`INSERT INTO schema_migrations (version) VALUES (${version})`);
}

async function removeMigrationRecord(
  db: ReturnType<typeof drizzle>,
  version: string
): Promise<void> {
  await db.execute(
    sql`DELETE FROM schema_migrations WHERE version = ${version}`
  );
}

async function runSqlFile(
  db: ReturnType<typeof drizzle>,
  path: string
): Promise<void> {
  const content = await readFile(path, 'utf-8');
  await db.execute(sql.raw(content));
}

export async function migrate(
  direction: 'up' | 'down' = 'up',
  databaseUri?: string,
  silent: boolean = false
): Promise<void> {
  const pool = new Pool({
    connectionString: getDatabaseUri(databaseUri),
  });
  const db = drizzle(pool);

  try {
    await ensureMigrationsTable(db);
    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(db);

    if (direction === 'up') {
      for (const migration of migrationFiles) {
        const version = buildVersion(migration);

        if (appliedMigrations.has(version)) {
          if (!silent) {
            console.log(`✓ Migration ${version} already applied, skipping`);
          }
          continue;
        }

        if (!silent) {
          console.log(`Running migration ${version}...`);
        }

        await runSqlFile(db, migration.upPath);
        await recordMigration(db, version);

        if (!silent) {
          console.log(`✓ Migration ${version} applied successfully`);
        }
      }
      return;
    }

    const sortedApplied = Array.from(appliedMigrations).sort((a, b) => {
      const aMatch = a.match(/^(\d+)_/);
      const bMatch = b.match(/^(\d+)_/);
      if (!aMatch || !bMatch) {
        return a.localeCompare(b);
      }
      return compareMigrationPrefix(aMatch[1]!, bMatch[1]!);
    });
    sortedApplied.reverse();
    if (sortedApplied.length === 0) {
      if (!silent) {
        console.log('No migrations to rollback');
      }
      return;
    }

    const lastVersion = sortedApplied[0]!;
    const match = lastVersion.match(/^(\d+)_(.+)$/);
    if (!match) {
      throw new Error(`Invalid migration version format: ${lastVersion}`);
    }

    const migrationPrefix = match[1]!;
    const migration = migrationFiles.find((m) => m.prefix === migrationPrefix);
    if (!migration || !migration.downPath) {
      throw new Error(
        `Migration ${lastVersion} not found or missing down file`
      );
    }

    if (!silent) {
      console.log(`Rolling back migration ${lastVersion}...`);
    }

    await runSqlFile(db, migration.downPath);
    await removeMigrationRecord(db, lastVersion);

    if (!silent) {
      console.log(`✓ Migration ${lastVersion} rolled back successfully`);
    }
  } finally {
    await pool.end();
  }
}

export async function status(databaseUri?: string): Promise<void> {
  const pool = new Pool({
    connectionString: getDatabaseUri(databaseUri),
  });
  const db = drizzle(pool);

  try {
    await ensureMigrationsTable(db);
    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(db);

    console.log('\nMigration Status:');
    console.log('================\n');

    for (const migration of migrationFiles) {
      const version = buildVersion(migration);
      const migrationStatus = appliedMigrations.has(version)
        ? '✓ Applied'
        : '○ Pending';
      console.log(`${migrationStatus}  ${version}`);
    }
    console.log('');
  } finally {
    await pool.end();
  }
}

const command = process.argv[2];

if (command === 'up' || !command) {
  migrate('up').catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
} else if (command === 'down') {
  migrate('down').catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });
} else if (command === 'status') {
  status().catch((error) => {
    console.error('Status check failed:', error);
    process.exit(1);
  });
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: bun src/database/migrate.ts [up|down|status]');
  process.exit(1);
}
