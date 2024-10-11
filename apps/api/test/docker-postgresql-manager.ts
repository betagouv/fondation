import * as path from 'path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from 'testcontainers';
import { DataSource } from 'typeorm';
import { ormConfigTest } from './orm-config.test';

const composeFilePath = path.resolve(process.cwd(), 'test');
const composeFile = 'docker-compose-postgresql-test.yaml';

export let dockerDBInstance: StartedDockerComposeEnvironment | null = null;

export const startDockerPostgresql = async (): Promise<void> => {
  try {
    dockerDBInstance = await new DockerComposeEnvironment(
      composeFilePath,
      composeFile,
    ).up();

    await new DataSource(ormConfigTest('src')).initialize();
  } catch (e) {
    console.log(e);
    throw new Error('Fail to start the database' + e);
  }
};

export async function clearDB(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    const schemaName = entity.schema || 'public';
    await repository.query(
      `TRUNCATE ${schemaName}.${entity.tableName} RESTART IDENTITY CASCADE;`,
    );
  }
}
