import { HttpStatus, INestApplication } from '@nestjs/common';
import { Magistrat, TypeDeSaisine } from 'shared-models';
import { MainAppConfigurator } from 'src/main.configurator';

import { randomUUID } from 'node:crypto';
import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { SessionSnapshot } from 'shared-models/models/session/session-content';
import { dossierDeNominationPm } from 'src/nominations-context/dossier-de-nominations/adapters/primary/secondary/gateways/repositories/drizzle/schema/dossier-de-nomination-pm';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import { SecureCrossContextRequestBuilder } from 'test/secure-cross-context-request.builder';
import { sessionPm } from '../../secondary/gateways/repositories/drizzle/schema';

let aSessionId: string;
let aDossierId: string;

const aDossierDeNominationImportéId = '7d39c745-8186-46b6-8856-3f77cc93e5e8';
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

    const [session] = await db
      .insert(sessionPm)
      .values({
        content: {},
        formation: Magistrat.Formation.PARQUET,
        name: 'Session 1',
        sessionImportéeId: aSessionImportéeId,
        typeDeSaisine: 'TRANSPARENCE_GDS',
      })
      .returning({ id: sessionPm.id });
    aSessionId = session!.id;

    const [dossier] = await db
      .insert(dossierDeNominationPm)
      .values({
        number: dossierContent.folderNumber,
        sessionId: aSessionId,
        dossierDeNominationImportéId: aDossierDeNominationImportéId,
      })
      .returning({ id: dossierDeNominationPm.id });
    aDossierId = dossier!.id;

    const moduleFixture = await new AppTestingModule().compile();
    app = new MainAppConfigurator(
      moduleFixture.createNestApplication(),
    ).configure();

    await app.init();
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  describe('Session snapshot', () => {
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
        content: {},
      });
    });

    it('returns 404 when dossier does not exist', async () => {
      await requestSessionSnapshot(randomUUID()).expect(HttpStatus.NOT_FOUND);
    });

    const requestSessionSnapshot = (id: string) =>
      new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((agent) =>
          agent.get(`/api/nominations/sessions/session/snapshot/by-id/${id}`),
        )
        .request();
  });

  describe('Dossier de nomination snapshot', () => {
    it('retrieves a dossier de nomination snapshot by ID', async () => {
      const response = await requestDossierSnapshot(aDossierId).expect(
        HttpStatus.OK,
      );

      expect(response.body).toEqual({
        id: aDossierId,
        sessionId: aSessionId,
        nominationFileImportedId: aDossierDeNominationImportéId,
        content: dossierContent,
      });
    });

    it('returns 404 when dossier does not exist', async () => {
      await requestDossierSnapshot(randomUUID()).expect(HttpStatus.NOT_FOUND);
    });

    const requestDossierSnapshot = (id: string) =>
      new SecureCrossContextRequestBuilder(app)
        .withTestedEndpoint((agent) =>
          agent.get(
            `/api/nominations/dossier-de-nominations/snapshot/by-id/${id}`,
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
