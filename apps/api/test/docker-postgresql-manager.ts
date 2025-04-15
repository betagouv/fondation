import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as path from 'path';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { migrateDrizzle } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-migrate';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';

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

export async function clearDB(dbToClear: NodePgDatabase | DrizzleDb) {
  // Disable foreign key constraints
  await dbToClear.execute(sql`SET session_replication_role = 'replica'` as any);

  try {
    const query = sql<string>`SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema LIKE '%context'
      AND table_type = 'BASE TABLE';
  `;

    const tables: { rows: { table_schema: string; table_name: string }[] } =
      await dbToClear.execute(query);

    for (const table of tables.rows) {
      await dbToClear.execute(
        sql`TRUNCATE TABLE ${sql.identifier(table.table_schema)}.${sql.identifier(table.table_name)} RESTART IDENTITY CASCADE`,
      );
    }
  } finally {
    // Re-enable foreign key constraints
    await dbToClear.execute(
      sql`SET session_replication_role = 'origin'` as any,
    );
  }
}
