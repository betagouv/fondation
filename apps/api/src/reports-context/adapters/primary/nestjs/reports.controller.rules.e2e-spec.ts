import { HttpStatus, INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MainAppConfigurator } from 'src/main.configurator';
import { ReportRule } from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import request from 'supertest';
import {
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';
import { clearDB } from 'test/docker-postgresql-manager';
import { reportRules } from '../../secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SqlReportRuleRepository } from '../../secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import { ChangeRuleValidationStateDto } from './dto/change-rule-validation-state.dto';
import {
  AppTestingModule,
  stubDossier,
  stubSession,
} from './reports.controller.fixtures';

describe('Reports Controller - Rules', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let givenSomeReports: GivenSomeReports;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
  });
  beforeEach(async () => {
    await clearDB(db);
    await givenSomeReports(report);
  });
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  it('requires a valid user session', async () => {
    await initApp({ validatedSession: false });
    await requestReportRule().expect(HttpStatus.UNAUTHORIZED);
  });

  describe('With authenticated session', () => {
    beforeEach(() => initApp({ validatedSession: true }));

    it('forbids unvalidated body', async () => {
      const wrongBody = {
        validated: 'false',
      };
      await requestReportRule().send(wrongBody).expect(HttpStatus.BAD_REQUEST);
    });

    it('unvalidates an overseas to overseas validation rule', async () => {
      const ruleRow = SqlReportRuleRepository.mapSnapshotToDb(reportRule);
      await db.insert(reportRules).values(ruleRow).execute();

      const body: ChangeRuleValidationStateDto = {
        validated: false,
      };
      const response = await requestReportRule()
        .send(body)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual({});

      const savedReportRules = await db
        .select()
        .from(reportRules)
        .where(eq(reportRules.id, reportRule.id))
        .execute();
      expect(savedReportRules).toEqual([
        SqlReportRuleRepository.mapToDb(
          ReportRule.fromSnapshot({
            ...reportRule,
            validated: false,
          }),
        ),
      ]);
    });
  });

  const requestReportRule = () =>
    request(app.getHttpServer())
      .put(`/api/reports/rules/${reportRule.id}`)
      .set('Cookie', 'sessionId=unused');

  const initApp = async ({
    validatedSession,
  }: {
    validatedSession: boolean;
  }) => {
    const moduleFixture = await new AppTestingModule(db)
      .withStubSessionValidationService(validatedSession)
      .withStubUserService()
      .withStubSessionService()
      .withStubDossierDeNominationService()
      .compile();

    app = new MainAppConfigurator(moduleFixture.createNestApplication())
      .withCookies()
      .configure();

    await app.init();
  };
});

const report = ReportBuilder.fromDossierDeNomination(
  stubDossier,
  stubSession,
).build();
const reportRule = new ReportRuleBuilder('uuid')
  .with('reportId', report.id)
  .build();
