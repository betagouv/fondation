import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const ormConfig = (
  rootDirectory: string = 'dist/src',
): PostgresConnectionOptions => ({
  type: 'postgres',
  host: 'localhost',
  port: 5440,
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

export const getEntitiesFiles = (rootDirectory: string) => [
  `${rootDirectory}/**/adapters/secondary/repositories/typeorm/entities/*.{ts,js}`,
  `${rootDirectory}/**/adapters/secondary/gateways/repositories/typeorm/entities/*.{ts,js}`,
];
export const getMigrationFiles = (rootDirectory: string) => [
  `${rootDirectory}/**/adapters/secondary/repositories/typeorm/migrations/*.{ts,js}`,
  `${rootDirectory}/**/adapters/secondary/gateways/repositories/typeorm/migrations/*.{ts,js}`,
];
