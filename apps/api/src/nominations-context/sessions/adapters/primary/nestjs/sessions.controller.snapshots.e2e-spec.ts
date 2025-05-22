import { HttpStatus, INestApplication } from '@nestjs/common';
import { Magistrat, TypeDeSaisine } from 'shared-models';
import { MainAppConfigurator } from 'src/main.configurator';
import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { SessionSnapshot } from 'src/nominations-context/sessions/business-logic/models/session';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { SecureCrossContextRequestBuilder } from 'test/secure-cross-context-request.builder';
import { sessionPm } from '../../secondary/gateways/repositories/drizzle/schema';
import { dossierDeNominationPm } from '../../secondary/gateways/repositories/drizzle/schema/dossier-de-nomination-pm';

const aDossierId = '885e0f4b-0ace-4023-a8bc-b3a678448e51';
const aDossierDeNominationImportéId = '7d39c745-8186-46b6-8856-3f77cc93e5e8';
const aSessionId = 'a805f436-0f59-4b1d-b0cf-b382405eed68';
const aSessionImportéeId = '4ebd0b50-d2e8-484c-a18d-7531879118ca';
const dossierContent = {
  folderNumber: 123,
};

describe('Sessions Controller- Snapshots', () => {
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
      const response = await requestSessionSnapshot(aSessionId).expect(
        HttpStatus.OK,
      );

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
      await requestSessionSnapshot(aDossierId).expect(HttpStatus.NOT_FOUND);
    });

    const requestSessionSnapshot = (id: string) =>
      new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((agent) =>
          agent.get(`/api/nominations/sessions/session/snapshot/by-id/${id}`),
        )
        .request();
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
      const response = await requestDossierSnapshot(aDossierId).expect(
        HttpStatus.OK,
      );

      expect(response.body).toEqual<DossierDeNominationSnapshot>({
        id: aDossierId,
        sessionId: aSessionId,
        nominationFileImportedId: aDossierDeNominationImportéId,
        content: dossierContent,
      });
    });

    it('returns 404 when dossier does not exist', async () => {
      await requestDossierSnapshot(aSessionId).expect(HttpStatus.NOT_FOUND);
    });

    const requestDossierSnapshot = (id: string) =>
      new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((agent) =>
          agent.get(
            `/api/nominations/sessions/dossier-de-nomination/snapshot/by-id/${id}`,
          ),
        )
        .request();
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }
  }
});
