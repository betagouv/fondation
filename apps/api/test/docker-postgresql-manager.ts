import { sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as path from 'path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from 'testcontainers';
import { nominationFiles } from '../src/data-administrator-context/adapters/secondary/gateways/repositories/drizzle/schema';
import {
  reportRules,
  reports,
} from '../src/reporter-context/adapters/secondary/gateways/repositories/drizzle/schema/index';
import { drizzleConfigForTest } from '../src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from '../src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-instance';
import { migrateDrizzle } from '../src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-migrate';

const composeFilePath = path.resolve(process.cwd(), 'test');
const composeFile = 'docker-compose-postgresql-test.yaml';

export let dockerDBInstance: StartedDockerComposeEnvironment | null = null;
export let db: DrizzleDb;

export const startDockerPostgresql = async (): Promise<void> => {
  try {
    dockerDBInstance = await new DockerComposeEnvironment(
      composeFilePath,
      composeFile,
    ).up();

    db = getDrizzleInstance(drizzleConfigForTest);

    await migrateDrizzle(db);

    console.log('Database started and Drizzle ORM initialized');
  } catch (e) {
    console.error(e);
    throw new Error('Failed to start the database: ' + e);
  }
};

export async function clearDB(dbToClear: DrizzleDb) {
  const tables = [reports, reportRules, nominationFiles];

  // Disable foreign key constraints
  await dbToClear.execute(sql`SET session_replication_role = 'replica'` as any);

  try {
    for (const table of tables) {
      const tableConfig = getTableConfig(table);
      const tableName = tableConfig.name;
      const schemaName = tableConfig.schema || 'public';
      await dbToClear.execute(
        sql`TRUNCATE TABLE ${sql.identifier(schemaName)}.${sql.identifier(tableName)} RESTART IDENTITY CASCADE`,
      );
    }
  } finally {
    // Re-enable foreign key constraints
    await dbToClear.execute(
      sql`SET session_replication_role = 'origin'` as any,
    );
  }
}
