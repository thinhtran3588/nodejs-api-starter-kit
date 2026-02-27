import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createTimestampPrefix(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  const minute = String(now.getUTCMinutes()).padStart(2, '0');
  const second = String(now.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hour}${minute}${second}`;
}

function sanitizeMigrationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function createMigration(name: string): Promise<void> {
  const migrationPrefix = createTimestampPrefix();
  const sanitizedName = sanitizeMigrationName(name);
  const migrationsDir = join(__dirname, 'migrations');

  const upFile = join(
    migrationsDir,
    `${migrationPrefix}_${sanitizedName}.up.sql`
  );
  const downFile = join(
    migrationsDir,
    `${migrationPrefix}_${sanitizedName}.down.sql`
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

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: bun src/database/create-migration.ts <migration-name>');
  console.error(
    'Example: bun src/database/create-migration.ts add_user_preferences'
  );
  process.exit(1);
}

createMigration(migrationName).catch((error) => {
  console.error('Failed to create migration:', error);
  process.exit(1);
});
