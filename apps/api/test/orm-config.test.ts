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
  entities: [
    `${rootDirectory}/**/adapters/secondary/repositories/typeorm/entities/*.{ts,js}`,
    `${rootDirectory}/**/adapters/secondary/gateways/repositories/typeorm/entities/*.{ts,js}`,
  ],
  migrationsRun: true,
  migrations: [
    `${rootDirectory}/**/adapters/secondary/repositories/typeorm/migrations/*.{ts,js}`,
    `${rootDirectory}/**/adapters/secondary/gateways/repositories/typeorm/migrations/*.{ts,js}`,
  ],
});
