import {
  getEntitiesFiles,
  getMigrationFiles,
} from '../src/shared-kernel/adapters/secondary/repositories/orm-config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const ormConfigTest = (
  rootDirectory: string = 'src',
): PostgresConnectionOptions => ({
  type: 'postgres',
  host: 'localhost',
  port: 5435,
  username: 'fondation',
  password: 'secret',
  database: 'fondation',
  synchronize: true,
  logging: false,
  logger: 'simple-console',
  entities: getEntitiesFiles(rootDirectory),
  migrationsRun: true,
  migrations: getMigrationFiles(rootDirectory),
});
