import { faker } from '@faker-js/faker';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Gender, Magistrat, Role } from 'shared-models';
import { AppModule } from 'src/app.module';
import { DateOnly } from 'src/utils/date-only';
import { agent } from 'supertest';
import { AdministrationService } from '../administration/administration.service';
import { PrismaService } from '../framework/database';
import { SessionService } from '../session/infrastructure/sessions.service';
import { SimpleAuthService } from '../simple-auth';
import { LoginDto } from '../simple-auth/infrastructure/dto/auth.dto';
import { CreatedAgendaDto, CreateOrUpdateAgendaDto } from './infrastructure/docs.dto';
import { FoundAgendaNominationFiles } from './infrastructure/finders/agenda-nomination-files.finder';

describe('Docs Service', () => {
  let app: INestApplication;
  let auth: SimpleAuthService;
  let http: ReturnType<typeof agent>;

  let chairman: { id: string };
  let session: { id: string };
  let user: { id: string; cookie: string; email: string; password: string };

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    app = await AppModule.create();
    app.useLogger(['error', 'fatal']);
    await app.init();

    auth = app.get(SimpleAuthService);
    http = agent(app.getHttpServer());

    user = {
      id: '',
      cookie: '',
      email: faker.internet
        .email({ lastName: `${faker.person.lastName()}+${crypto.randomUUID()}` })
        .toLowerCase(),
      password: faker.string.alphanumeric({ length: 20 }),
    };

    chairman = await auth.registerUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: Gender.M,
      role: Role.MEMBRE_DU_PARQUET,
      email: faker.internet
        .email({ lastName: `${faker.person.lastName()}+${crypto.randomUUID()}` })
        .toLowerCase(),
      password: faker.string.alphanumeric({ length: 20 }),
    });

    const admin = app.get(AdministrationService);
    await admin.updateTole({ userId: chairman.id, role: 'PRESIDENT_PARQUET' });

    const { id: userId } = await auth.registerUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      gender: Gender.M,
      role: Role.ADJOINT_SECRETAIRE_GENERAL,
      email: user.email,
      password: user.password,
    });
    user.id = userId;

    // FIXME: Replace with a LOLFI archive generation
    const [antonioGramsci, hannahArendt] = Array.from({ length: 2 }).map(() => ({
      id: crypto.randomUUID(),
      external: faker.number.int({ min: 10_000, max: 1e8 }),
    }));

    const prisma = app.get(PrismaService);
    await prisma.$transaction(async (tx) => {
      await tx.magistrat.createMany({
        skipDuplicates: true,
        data: [
          {
            id: antonioGramsci!.id,
            firstName: 'ANTONION',
            lastName: 'GRAMSCI',
            birthDate: new Date('1981-01-22'),
            civilite: 'M.',
            externalId: antonioGramsci!.external.toString(),
          },
          {
            id: hannahArendt!.id,
            firstName: 'ARENDT',
            lastName: 'HANNAH',
            birthDate: new Date('1981-01-22'),
            civilite: 'MME',
            externalId: hannahArendt!.external.toString(),
          },
        ],
      });

      await tx.function.createMany({
        skipDuplicates: true,
        data: {
          id: 'PR',
          label: 'Procureur de la République',
          label_one_male: 'procureur de la République',
          label_one_female: 'procureure de la République',
          sort: 1,
        },
      });

      await tx.jurisdictionType.createMany({
        skipDuplicates: true,
        data: [{ id: 'CA', label: `Cour d'appel`, sort: 1 }],
      });

      await tx.jurisdiction.createMany({
        skipDuplicates: true,
        data: [
          { codejur: 'CA  AMIENS', typeJur: 'CA' },
          { codejur: 'CA  REIMS', typeJur: 'CA' },
          { codejur: 'CA  LYON', typeJur: 'CA' },
          { codejur: 'CA  GRENOBLE', typeJur: 'CA' },
        ],
      });

      await tx.grade.createMany({ skipDuplicates: true, data: { grade: 'G3', label: 'G3', sort: 1 } });

      await tx.position.createMany({
        skipDuplicates: true,
        data: [
          {
            id: 1001,
            gradeId: 'G3',
            functionId: 'PR',
            jurisdictionId: 'CA  AMIENS',
            jurisdictionTypeId: 'CA',
          },
          {
            id: 1002,
            gradeId: 'G3',
            functionId: 'PR',
            jurisdictionId: 'CA  REIMS',
            jurisdictionTypeId: 'CA',
          },
          {
            id: 1003,
            gradeId: 'G3',
            functionId: 'PR',
            jurisdictionId: 'CA  GRENOBLE',
            jurisdictionTypeId: 'CA',
          },
          { id: 1004, gradeId: 'G3', functionId: 'PR', jurisdictionId: 'CA  LYON', jurisdictionTypeId: 'CA' },
        ],
      });
    });

    const sessions = app.get(SessionService);
    session = await sessions.createNominationSessionFromLodam({
      userId,
      name: `Transparence ${crypto.randomUUID()}`,
      date: DateOnly.fromString('10/02/2026'),
      observationClosingDate: DateOnly.fromString('20/02/2026'),
      dueDate: null,
      formation: Magistrat.Formation.PARQUET,
      positionStartDate: null,
      files: [
        {
          fileNumber: 1,
          name: 'Antonio GRAMSCI',
          birthDate: DateOnly.fromString('22/01/1981'),
          grade: Magistrat.Grade.G3,
          currentPosition: 'Procureur de la République CA  AMIENS',
          targetedGrade: Magistrat.Grade.G3,
          targetedPosition: 'Procureur  de la République CA  REIMS',
          rank: '(7 sur 12)',
          biography: null,
          careerInformation: null,
          lastPositionDate: DateOnly.fromString('02/02/2020'),
          lastRankingDate: DateOnly.fromString('01/09/2020'),
          observers: [],
          reporters: [],
        },
        {
          fileNumber: 2,
          name: 'Hannah ARENDT',
          birthDate: DateOnly.fromString('14/10/1906'),
          grade: Magistrat.Grade.G3,
          currentPosition: 'Procureur de la République CA  GRENOBLE',
          targetedGrade: Magistrat.Grade.G3,
          targetedPosition: 'Procureur  de la République CA  LYON',
          rank: '(4 sur 6)',
          biography: null,
          careerInformation: null,
          lastPositionDate: DateOnly.fromString('02/02/2020'),
          lastRankingDate: DateOnly.fromString('01/09/2020'),
          observers: [],
          reporters: [],
        },
      ],
    });

    await prisma.dossierDeNomination.updateMany({
      where: { sessionId: session.id, number: 1 },
      data: {
        detectedMagistratId: antonioGramsci!.id,
        detectedJurisdictionId: 'CA  REIMS',
        detectedTargetedFunctionId: 'PR',
        detectedTargetedPositionId: 1002,
      },
    });

    await prisma.dossierDeNomination.updateMany({
      where: { sessionId: session.id, number: 2 },
      data: {
        detectedMagistratId: hannahArendt!.id,
        detectedJurisdictionId: 'CA  LYON',
        detectedTargetedFunctionId: 'PR',
        detectedTargetedPositionId: 1004,
      },
    });

    const response = await http
      .post('/api/auth/v2/login')
      .send(user satisfies LoginDto)
      .expect(HttpStatus.NO_CONTENT);
    user.cookie = response.headers['set-cookie']!;

    await http
      .post(`/api/sessions/v2/${session.id}/files/reporters/versions`)
      .set({ cookie: user.cookie })
      .expect(HttpStatus.NO_CONTENT);
  });

  beforeEach(async () => {
    const response = await http
      .post('/api/auth/v2/login')
      .send(user satisfies LoginDto)
      .expect(HttpStatus.NO_CONTENT);

    user.cookie = response.headers['set-cookie']!;
  });

  it('should prevent creating an agenda with twice the same file', async () => {
    const foundAgendaNominationFiles = await http
      .get(`/api/docs/v1/sessions/${session.id}/files`)
      .set({ cookie: user.cookie })
      .expect(HttpStatus.OK);

    const nominationFiles: FoundAgendaNominationFiles = foundAgendaNominationFiles.body;
    expect((nominationFiles as FoundAgendaNominationFiles).items).toHaveLength(2);

    const agenda1 = await http
      .post(`/api/docs/v1/sessions/${session.id}/agendas`)
      .set({ cookie: user.cookie })
      .send({
        chairmanId: chairman.id,
        date: { day: 1, month: 2, year: 2026 },
        sessionMeetingDate: { day: 10, month: 2, year: 2026 },
        nominationFileIds: [nominationFiles.items[0]!.id],
      } satisfies CreateOrUpdateAgendaDto)
      .expect(HttpStatus.CREATED);

    expect(agenda1.body as CreatedAgendaDto).toEqual({ id: expect.any(String) });

    await http
      .post(`/api/docs/v1/sessions/${session.id}/agendas`)
      .set({ cookie: user.cookie })
      .send({
        chairmanId: chairman.id,
        date: { day: 2, month: 2, year: 2026 },
        sessionMeetingDate: { day: 11, month: 2, year: 2026 },
        nominationFileIds: [nominationFiles.items[0]!.id],
      } satisfies CreateOrUpdateAgendaDto)
      .expect(HttpStatus.BAD_REQUEST);
  });
});
