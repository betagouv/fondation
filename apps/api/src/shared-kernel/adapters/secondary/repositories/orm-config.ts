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
  synchronize: false,
  logging: false,
  logger: 'simple-console',
  entities: [
    `${rootDirectory}/**/adapters/secondary/repositories/typeorm/entities/*.{ts,js}`,
  ],
  migrationsRun: true,
  migrations: [
    `${rootDirectory}/**/adapters/secondary/repositories/typeorm/migrations/*.{ts,js}`,
  ],
});
