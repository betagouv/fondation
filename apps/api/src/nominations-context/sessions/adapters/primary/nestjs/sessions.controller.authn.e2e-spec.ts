import { HttpStatus, INestApplication } from '@nestjs/common';
import { MainAppConfigurator } from 'src/main.configurator';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';

const aDossierId = '885e0f4b-0ace-4023-a8bc-b3a678448e51';

describe('Sessions Controller - Authn', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await new AppTestingModule().compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    await app.init();
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('rejects if missing system request token', async () => {
    await supertest(app.getHttpServer())
      .get(
        `/api/nominations/dossier-de-nominations/snapshot/by-id/${aDossierId}`,
      )
      .expect(HttpStatus.UNAUTHORIZED);
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }
  }
});
