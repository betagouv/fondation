import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { DrizzleDb } from './drizzle-instance';
import path from 'path';

export const migrateDrizzle = async (db: DrizzleDb) => {
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  await migrate(db, {
    migrationsFolder,
  });
};
