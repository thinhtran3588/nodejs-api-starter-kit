import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { Sequelize } from 'sequelize';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationFile {
  number: number;
  name: string;
  upPath: string;
  downPath: string;
}

/**
 * Create database connection
 * Uses provided database URI or falls back to WRITE_DATABASE_URI environment variable
 */
function createDatabaseConnection(databaseUri?: string): Sequelize {
  const uri = databaseUri || process.env['WRITE_DATABASE_URI'] || '';

  if (!uri) {
    throw new Error(
      'Database URI must be provided or WRITE_DATABASE_URI must be set'
    );
  }

  return new Sequelize(uri, {
    dialect: 'postgres',
    logging: false,
  });
}

/**
 * Parse migration file name to extract number and name
 * Format: {number}_{name}.{up|down}.sql
 */
function parseMigrationFileName(filename: string): {
  number: number;
  name: string;
  direction: 'up' | 'down';
} | null {
  const match = filename.match(/^(\d+)_(.+)\.(up|down)\.sql$/);
  if (!match) {
    return null;
  }

  return {
    number: Number.parseInt(match[1]!, 10),
    name: match[2]!,
    direction: match[3] as 'up' | 'down',
  };
}

/**
 * Get all migration files from the migrations directory
 */
async function getMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = join(__dirname, 'migrations');
  const files = await readdir(migrationsDir);

  const migrations = new Map<number, Partial<MigrationFile>>();

  for (const file of files) {
    const parsed = parseMigrationFileName(file);
    if (!parsed) {
      continue;
    }

    const existing = migrations.get(parsed.number);
    if (!existing) {
      migrations.set(parsed.number, {
        number: parsed.number,
        name: parsed.name,
      });
    }

    const migration = migrations.get(parsed.number)!;
    const filePath = join(migrationsDir, file);

    if (parsed.direction === 'up') {
      migration.upPath = filePath;
    } else {
      migration.downPath = filePath;
    }
  }

  // Convert to array and filter out incomplete migrations
  return Array.from(migrations.values())
    .filter((m): m is MigrationFile => !!(m.upPath && m.downPath))
    .sort((a, b) => a.number - b.number);
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable(sequelize: Sequelize): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of applied migrations
 */
export async function getAppliedMigrations(
  sequelize: Sequelize
): Promise<Set<string>> {
  const queryResult = await sequelize.query(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  // Sequelize.query returns [results, metadata] tuple
  const results = (
    Array.isArray(queryResult) && queryResult[0] ? queryResult[0] : []
  ) as Array<{ version: string }>;
  return new Set(results.map((row) => row.version));
}

/**
 * Record a migration as applied
 */
async function recordMigration(
  sequelize: Sequelize,
  version: string,
  name: string
): Promise<void> {
  // Escape single quotes in version and name to prevent SQL injection
  const escapedVersion = version.replace(/'/g, "''");
  const escapedName = name.replace(/'/g, "''");
  await sequelize.query(
    `INSERT INTO schema_migrations (version, name) VALUES ('${escapedVersion}', '${escapedName}')`
  );
}

/**
 * Remove a migration record
 */
async function removeMigrationRecord(
  sequelize: Sequelize,
  version: string
): Promise<void> {
  // Escape single quotes in version to prevent SQL injection
  const escapedVersion = version.replace(/'/g, "''");
  await sequelize.query(
    `DELETE FROM schema_migrations WHERE version = '${escapedVersion}'`
  );
}

/**
 * Run migrations
 * @param direction - 'up' to apply migrations, 'down' to rollback
 * @param databaseUri - Optional database URI (uses WRITE_DATABASE_URI if not provided)
 * @param silent - If true, suppresses console output (useful for tests)
 */
export async function migrate(
  direction: 'up' | 'down' = 'up',
  databaseUri?: string,
  silent: boolean = false
): Promise<void> {
  const sequelize = createDatabaseConnection(databaseUri);

  try {
    await ensureMigrationsTable(sequelize);

    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(sequelize);

    if (direction === 'up') {
      // Run pending migrations
      for (const migration of migrationFiles) {
        const version = `${migration.number.toString().padStart(3, '0')}_${migration.name}`;

        if (appliedMigrations.has(version)) {
          if (!silent) {
            console.log(`✓ Migration ${version} already applied, skipping`);
          }
          continue;
        }

        if (!silent) {
          console.log(`Running migration ${version}...`);
        }
        const content = await readFile(migration.upPath, 'utf-8');
        await sequelize.query(content);
        await recordMigration(sequelize, version, migration.name);
        if (!silent) {
          console.log(`✓ Migration ${version} applied successfully`);
        }
      }
    } else {
      // Rollback last migration
      const sortedApplied = Array.from(appliedMigrations).sort().reverse();
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

      const migrationNumber = Number.parseInt(match[1]!, 10);
      const migration = migrationFiles.find(
        (m) => m.number === migrationNumber
      );
      if (!migration || !migration.downPath) {
        throw new Error(
          `Migration ${lastVersion} not found or missing down file`
        );
      }

      if (!silent) {
        console.log(`Rolling back migration ${lastVersion}...`);
      }
      const content = await readFile(migration.downPath, 'utf-8');
      await sequelize.query(content);
      await removeMigrationRecord(sequelize, lastVersion);
      if (!silent) {
        console.log(`✓ Migration ${lastVersion} rolled back successfully`);
      }
    }
  } finally {
    await sequelize.close();
  }
}

/**
 * Rollback all migrations (clears the database)
 * @param databaseUri - Optional database URI (uses WRITE_DATABASE_URI if not provided)
 * @param silent - If true, suppresses console output (useful for tests)
 */
export async function rollbackAll(
  databaseUri?: string,
  silent: boolean = false
): Promise<void> {
  const sequelize = createDatabaseConnection(databaseUri);

  try {
    await ensureMigrationsTable(sequelize);

    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(sequelize);

    if (appliedMigrations.size === 0) {
      if (!silent) {
        console.log('No migrations to rollback');
      }
      return;
    }

    // Rollback migrations in reverse order
    const sortedApplied = Array.from(appliedMigrations).sort().reverse();

    for (const version of sortedApplied) {
      const match = version.match(/^(\d+)_(.+)$/);
      if (!match) {
        throw new Error(`Invalid migration version format: ${version}`);
      }

      const migrationNumber = Number.parseInt(match[1]!, 10);
      const migration = migrationFiles.find(
        (m) => m.number === migrationNumber
      );
      if (!migration || !migration.downPath) {
        throw new Error(`Migration ${version} not found or missing down file`);
      }

      if (!silent) {
        console.log(`Rolling back migration ${version}...`);
      }
      const content = await readFile(migration.downPath, 'utf-8');
      await sequelize.query(content);
      await removeMigrationRecord(sequelize, version);
      if (!silent) {
        console.log(`✓ Migration ${version} rolled back successfully`);
      }
    }
  } finally {
    await sequelize.close();
  }
}

/**
 * Show migration status
 * @param databaseUri - Optional database URI (uses WRITE_DATABASE_URI if not provided)
 */
export async function status(databaseUri?: string): Promise<void> {
  const sequelize = createDatabaseConnection(databaseUri);

  try {
    await ensureMigrationsTable(sequelize);

    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations(sequelize);

    console.log('\nMigration Status:');
    console.log('================\n');

    for (const migration of migrationFiles) {
      const version = `${migration.number.toString().padStart(3, '0')}_${migration.name}`;
      const applied = appliedMigrations.has(version);
      const status = applied ? '✓ Applied' : '○ Pending';
      console.log(`${status}  ${version}`);
    }

    console.log('');
  } finally {
    await sequelize.close();
  }
}

// Main execution
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
  console.error('Usage: tsx sequelize/migrate.ts [up|down|status]');
  process.exit(1);
}
