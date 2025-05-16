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
import { dossierDeNominationPm } from '../../secondary/gateways/repositories/drizzle/schema/dossier-de-nomination-pm';
import { DossierDeNominationSnapshot } from 'src/nominations-context/business-logic/models/dossier-de-nomination';
import { sessionPm } from '../../secondary/gateways/repositories/drizzle/schema';
import { Magistrat, TypeDeSaisine } from 'shared-models';
import { SessionSnapshot } from 'src/nominations-context/business-logic/models/session';

const aDossierId = '885e0f4b-0ace-4023-a8bc-b3a678448e51';
const aDossierDeNominationImportéId = '7d39c745-8186-46b6-8856-3f77cc93e5e8';
const aSessionId = 'a805f436-0f59-4b1d-b0cf-b382405eed68';
const aSessionImportéeId = '4ebd0b50-d2e8-484c-a18d-7531879118ca';
const dossierContent = {
  folderNumber: 123,
};

describe('Nominations Controller', () => {
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

  describe('Session snapshot', () => {
    beforeEach(async () => {
      await db
        .insert(sessionPm)
        .values({
          id: aSessionId,
          name: 'Session 1',
          formation: Magistrat.Formation.PARQUET,
          sessionImportéeId: aSessionImportéeId,
          typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        })
        .execute();
    });

    it('retrieves a session snapshot by ID', async () => {
      const response = await supertest(app.getHttpServer())
        .get(`/api/nominations/session/snapshot/by-id/${aSessionId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual<SessionSnapshot>({
        id: aSessionId,
        name: 'Session 1',
        formation: Magistrat.Formation.PARQUET,
        sessionImportéeId: aSessionImportéeId,
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        version: 1,
      });
    });

    it('returns 404 when dossier does not exist', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/nominations/session/snapshot/by-id/${aDossierId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Dossier de nomination snapshot', () => {
    beforeEach(async () => {
      await db
        .insert(dossierDeNominationPm)
        .values({
          id: aDossierId,
          sessionId: aSessionId,
          dossierDeNominationImportéId: aDossierDeNominationImportéId,
          content: JSON.stringify(dossierContent),
        })
        .execute();
    });

    it('retrieves a dossier de nomination snapshot by ID', async () => {
      const response = await supertest(app.getHttpServer())
        .get(
          `/api/nominations/dossier-de-nomination/snapshot/by-id/${aDossierId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toEqual<DossierDeNominationSnapshot>({
        id: aDossierId,
        sessionId: aSessionId,
        nominationFileImportedId: aDossierDeNominationImportéId,
        content: dossierContent,
      });
    });

    it('returns 404 when dossier does not exist', async () => {
      await supertest(app.getHttpServer())
        .get(
          `/api/nominations/dossier-de-nomination/snapshot/by-id/${aSessionId}`,
        )
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }
  }
});
