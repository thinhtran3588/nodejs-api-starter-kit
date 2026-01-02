/**
 * Database configuration
 * Returns both write and read database connection URIs
 * Uses WRITE_DATABASE_URI and READ_DATABASE_URI environment variables
 */
export function databaseConfig(): {
  writeDatabaseUri: string;
  readDatabaseUri: string;
} {
  const writeUri = process.env['WRITE_DATABASE_URI'];
  const readUri = process.env['READ_DATABASE_URI'];

  const writeDatabaseUri = writeUri ?? '';
  const readDatabaseUri = readUri ?? writeDatabaseUri;

  return {
    writeDatabaseUri,
    readDatabaseUri,
  };
}
