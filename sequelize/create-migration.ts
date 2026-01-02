import { readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the next migration number
 */
async function getNextMigrationNumber(): Promise<number> {
  const migrationsDir = join(__dirname, 'migrations');

  try {
    const files = await readdir(migrationsDir);
    const numbers = files
      .map((file) => {
        const match = file.match(/^(\d+)_/);
        return match ? Number.parseInt(match[1]!, 10) : 0;
      })
      .filter((n) => n > 0);

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  } catch {
    return 1;
  }
}

/**
 * Sanitize migration name (replace spaces and special chars with underscores)
 */
function sanitizeMigrationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Create migration files
 */
async function createMigration(name: string): Promise<void> {
  const migrationNumber = await getNextMigrationNumber();
  const sanitizedName = sanitizeMigrationName(name);
  const migrationsDir = join(__dirname, 'migrations');

  const upFile = join(
    migrationsDir,
    `${migrationNumber.toString().padStart(3, '0')}_${sanitizedName}.up.sql`
  );
  const downFile = join(
    migrationsDir,
    `${migrationNumber.toString().padStart(3, '0')}_${sanitizedName}.down.sql`
  );

  const upContent = `-- Migration: ${sanitizedName}
-- TODO: Add your migration SQL here

`;

  const downContent = `-- Rollback: ${sanitizedName}
-- TODO: Add your rollback SQL here

`;

  await writeFile(upFile, upContent);
  await writeFile(downFile, downContent);

  console.log(`✓ Created migration files:`);
  console.log(`  ${upFile}`);
  console.log(`  ${downFile}`);
}

// Main execution
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: tsx sequelize/create-migration.ts <migration-name>');
  console.error(
    'Example: tsx sequelize/create-migration.ts add_user_preferences'
  );
  process.exit(1);
}

createMigration(migrationName).catch((error) => {
  console.error('Failed to create migration:', error);
  process.exit(1);
});
