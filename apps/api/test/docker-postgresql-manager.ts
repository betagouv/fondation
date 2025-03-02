import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { getTableConfig, PgTableWithColumns } from 'drizzle-orm/pg-core';
import * as path from 'path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';
import { nominationFiles } from 'src/data-administration-context/adapters/secondary/gateways/repositories/drizzle/schema';
import * as filesContextTables from 'src/files-context/adapters/secondary/gateways/repositories/drizzle/schema/tables';
import * as reportsContextTables from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/tables';
import * as identityAndAccessContextTables from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/tables';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { migrateDrizzle } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import { domainEvents } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';

const composeFilePath = path.resolve(process.cwd(), 'test');
const composeFile = 'docker-compose-test.yaml';

export let dockerDBInstance: StartedDockerComposeEnvironment | null = null;
export let db: DrizzleDb;

export const startDockerPostgresql = async (): Promise<void> => {
  try {
    dockerDBInstance = await new DockerComposeEnvironment(
      composeFilePath,
      composeFile,
    )
      .withWaitStrategy(
        'postgres',
        Wait.forLogMessage('database system is ready to accept connections'),
      )
      .withWaitStrategy(
        'minio',
        Wait.forLogMessage('MinIO Object Storage Server'),
      )
      .up();

    console.log('Database started');
  } catch (e) {
    console.error(e);
    throw new Error('Failed to start the database: ' + e);
  }
};

export const migrateDockerPostgresql = async (): Promise<DrizzleDb> => {
  try {
    db = getDrizzleInstance(drizzleConfigForTest);
    await migrateDrizzle(db);
    console.log('Drizzle ORM initialized');
    return db;
  } catch (e) {
    console.error(e);
    throw new Error('Failed to migrate: ' + e);
  }
};

export async function clearDB(
  dbToClear: NodePgDatabase | DrizzleDb,
  tables: PgTableWithColumns<any>[] = [
    ...Object.values(reportsContextTables),
    ...Object.values(filesContextTables),
    ...Object.values(identityAndAccessContextTables),
    nominationFiles,
    domainEvents,
  ],
) {
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
