import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { DrizzleDb } from './drizzle-instance';
import path from 'path';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const migrationsFolder = path.resolve(process.cwd(), 'drizzle');

export const migrateDrizzle = async (db: DrizzleDb) => {
  await migrate(db, {
    migrationsFolder,
  });
};

export const getDrizzleMigrationSql = (migrationNumber: number) => {
  const migrationFiles = readMigrationFiles({
    migrationsFolder,
  });
  if (!migrationFiles[migrationNumber])
    throw new Error(`Migration ${migrationNumber} not found`);
  return migrationFiles[migrationNumber].sql.join('\n');
};
