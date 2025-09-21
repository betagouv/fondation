import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  DateOnlyJson,
  Magistrat,
  TransparenceSnapshotQueryParamsDto,
  TypeDeSaisine,
} from 'shared-models';
import { SessionSnapshot } from 'shared-models/models/session/session-content';
import { MainAppConfigurator } from 'src/main.configurator';
import { sessionPm } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/schema';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import supertest from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';

describe('Transparence Controller - Snapshots', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    const moduleFixture = await new AppTestingModule()
      .withStubSessionValidationService(true)
      .compile();
    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    await app.init();
  });

  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  describe('Transparence snapshot', () => {
    beforeEach(async () => {
      await db
        .insert(sessionPm)
        .values([uneTransparence, uneAutreTransparence])
        .execute();
    });

    it('retrieves a transparence snapshot by nom, formation, and date', async () => {
      const response = await requestTransparence(
        uneTransparence.name,
        uneTransparence.formation,
        uneTransparence.content.dateTransparence,
      ).expect(HttpStatus.OK);

      expect(response.body).toEqual(uneTransparence);
    });

    it('returns 404 when transparence does not exist', async () => {
      await requestTransparence(
        'NonExistingName',
        uneTransparence.formation,
        uneTransparence.content.dateTransparence,
      ).expect(HttpStatus.NOT_FOUND);
    });

    const requestTransparence = (
      nom: string,
      formation: Magistrat.Formation,
      dateTransparence: DateOnlyJson,
    ) => {
      const { year, month, day } = dateTransparence;
      const query: TransparenceSnapshotQueryParamsDto = {
        nom,
        formation,
        year,
        month,
        day,
      };

      return supertest(app.getHttpServer())
        .get(`/api/nominations/transparence/snapshot/by-nom-formation-et-date`)
        .set('Cookie', 'sessionId=unused')
        .query(query);
    };
  });

  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }
  }
});

const uneTransparence: SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS> = {
  id: 'a805f436-0f59-4b1d-b0cf-b382405eed68',
  name: 'Dupont',
  formation: Magistrat.Formation.PARQUET,
  sessionImportéeId: '0d1c2d11-75dd-4615-ba79-56f45835f707',
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  version: 1,
  content: {
    dateTransparence: {
      year: 2025,
      month: 7,
      day: 15,
    },
    dateClôtureDélaiObservation: {
      year: 2025,
      month: 7,
      day: 22,
    },
  },
};

const uneAutreTransparence: SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS> = {
  id: '49ba7861-b0e1-400b-abe2-bdfaf729d954',
  name: 'Dupont',
  formation: Magistrat.Formation.SIEGE,
  sessionImportéeId: 'c8b137b8-529f-40f2-bca2-9991fc965e52',
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  version: 1,
  content: {
    dateTransparence: {
      year: 2025,
      month: 7,
      day: 15,
    },
    dateClôtureDélaiObservation: {
      year: 2025,
      month: 7,
      day: 22,
    },
  },
};
