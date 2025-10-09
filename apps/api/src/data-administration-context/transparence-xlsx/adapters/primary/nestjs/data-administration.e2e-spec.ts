import { HttpStatus, INestApplication } from '@nestjs/common';
import { ImportNouvelleTransparenceDto } from 'shared-models';
import { Gender } from 'shared-models/models/gender';
import { Role } from 'shared-models/models/role';
import { TransparenceSnapshot } from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { unNomMagistrat } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/fixtures';
import { transparencesPm } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/drizzle/schema';
import { MainAppConfigurator } from 'src/main.configurator';

import { USER_SERVICE } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { StubUserService } from 'src/shared-kernel/adapters/secondary/gateways/services/stub-user.service';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import request from 'supertest';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { clearDB } from 'test/docker-postgresql-manager';
import {
  uneTransparence,
  uneTransparenceXlsxBuffer,
  unNomTransparenceXlsx,
} from './data-administration.fixtures';

describe('Data Administration Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
  });
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  describe('Import Nouvelle Transparence', () => {
    it('nécessite un user authentifié', async () => {
      await initApp({ validatedSession: false });
      const response = await uploadATestFile();
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('import une transparence Excel', async () => {
      await initApp({ validatedSession: true });
      await uploadATestFile().expect(HttpStatus.CREATED);
      await expectTransparences(uneTransparence);
    });

    const uploadATestFile = () => {
      const query: ImportNouvelleTransparenceDto = {
        formation: uneTransparence.formation,
        nomTransparence: uneTransparence.name,
        dateTransparence: DateOnly.fromJson(
          uneTransparence.dateTransparence,
        ).toISOString(),
        dateEcheance: DateOnly.fromJson(
          uneTransparence.dateEchéance,
        ).toISOString(),
        datePriseDePosteCible: DateOnly.fromJson(
          uneTransparence.datePriseDePosteCible,
        ).toISOString(),
        dateClotureDelaiObservation: DateOnly.fromJson(
          uneTransparence.dateClôtureDélaiObservation,
        ).toISOString(),
      };

      return request(app.getHttpServer())
        .post('/api/data-administration/import-nouvelle-transparence-xlsx')
        .set('Cookie', 'sessionId=unused')
        .query(query)
        .attach('fichier', uneTransparenceXlsxBuffer, unNomTransparenceXlsx);
    };
  });

  const initApp = async ({
    validatedSession,
  }: {
    validatedSession: boolean;
  }) => {
    const moduleFixture = await new AppTestingModule()
      .withStubSessionValidationService(validatedSession)
      .withStubUserService()
      .compile();

    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    await app.init();
  };

  const expectTransparences = async (
    ...expectedTranspas: TransparenceSnapshot[]
  ) => {
    const transpasDb = await db.select().from(transparencesPm).execute();
    expect(transpasDb).toEqual(
      expectedTranspas.map((t) => ({
        ...t,
        id: expect.any(String),
        createdAt: expect.any(Date),
        dateTransparence: DateOnly.fromJson(t.dateTransparence).toDate(),
        dateEchéance: t.dateEchéance
          ? DateOnly.fromJson(t.dateEchéance).toDate()
          : null,
        dateClôtureDélaiObservation: t.dateClôtureDélaiObservation
          ? DateOnly.fromJson(t.dateClôtureDélaiObservation).toDate()
          : null,
        datePriseDePosteCible: t.datePriseDePosteCible
          ? DateOnly.fromJson(t.datePriseDePosteCible).toDate()
          : null,
        nominationFiles: t.nominationFiles.map((n) => ({
          ...n,
          id: expect.any(String),
          createdAt: expect.any(String),
          content: {
            ...n.content,
            magistrat: unNomMagistrat,
          },
        })),
      })),
    );
  };
  class AppTestingModule extends BaseAppTestingModule {
    constructor() {
      super(db);
    }

    withStubUserService() {
      this.moduleFixture.overrideProvider(USER_SERVICE).useFactory({
        factory: () => {
          const userService = new StubUserService();
          userService.user = stubUser;
          return userService;
        },
      });
      return this;
    }
  }

  const stubUser = {
    userId: 'user-id',
    firstName: 'First-name',
    lastName: 'REPORTER',
    role: Role.MEMBRE_COMMUN,
    gender: Gender.M,
  };
});
