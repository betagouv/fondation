import { HttpStatus, INestApplication } from '@nestjs/common';
import crypto from 'crypto';
import {
  allRulesTuple,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
} from 'shared-models';
import { MainAppConfigurator } from 'src/main.configurator';
import { ReportRetrievalBuilder } from 'src/reports-context/business-logic/models/report-retrieval-vm.builder';
import { ReportRuleSnapshot } from 'src/reports-context/business-logic/models/report-rules';
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
import {
  AppTestingModule,
  reporterId,
  stubDossier,
  stubSession,
} from './reports.controller.fixtures';

describe('Reports Controller', () => {
  let app: INestApplication;
  let db: DrizzleDb;
  let givenSomeReports: GivenSomeReports;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
  });
  beforeEach(async () => {
    await clearDB(db);
  });
  afterEach(async () => await app.close());
  afterAll(async () => await db.$client.end());

  describe('List', () => {
    beforeEach(async () => {
      await givenSomeReports(aReportSnapshot);
    });

    it('requires a valid user session to list reports', async () => {
      await initApp({ validatedSession: false });
      await requestReportsList().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(() => initApp({ validatedSession: true }));

      it('lists reports owned by the reporter', async () => {
        await givenAReportNotOwned();
        const response = await requestReportsList().expect(HttpStatus.OK);
        expect(response.body).toEqual({ data: [aReportListingVM] });
      });
    });

    const aReportListingVM: ReportListItemVM = {
      id: 'f6c92518-19a1-488d-b518-5c39d3ac26c7',
      folderNumber: stubDossier.content.folderNumber,
      state: NominationFile.ReportState.NEW,
      dueDate: stubDossier.content.dueDate,
      formation: stubDossier.content.formation,
      name: stubDossier.content.name,
      transparency: stubSession.name,
      grade: stubDossier.content.grade,
      targettedPosition: stubDossier.content.targettedPosition,
      observersCount: stubDossier.content.observers.length,
    };
    const aReportSnapshot = ReportBuilder.fromListingVM(aReportListingVM)
      .with('dossierDeNominationId', stubDossier.id)
      .with('sessionId', stubSession.id)
      .with('reporterId', reporterId)
      .build();
    const requestReportsList = () =>
      request(app.getHttpServer())
        .get(`/api/reports/transparences`)
        .set('Cookie', 'sessionId=unused');
  });

  describe('Report retrieval', () => {
    let reportRulesSaved: (readonly [
      NominationFile.RuleGroup,
      ReportRuleSnapshot,
    ])[];

    beforeEach(async () => {
      await givenSomeReports(aReport);

      const reportRulesPromises = allRulesTuple.map(
        async ([ruleGroup, ruleName]) => {
          const reportRuleSnapshot = new ReportRuleBuilder()
            .with('id', crypto.randomUUID())
            .with('reportId', aReport.id)
            .with('ruleGroup', ruleGroup)
            .with('ruleName', ruleName)
            .build();

          const ruleRow =
            SqlReportRuleRepository.mapSnapshotToDb(reportRuleSnapshot);
          await db.insert(reportRules).values(ruleRow).execute();

          return [ruleGroup, reportRuleSnapshot] as const;
        },
      );
      reportRulesSaved = await Promise.all(reportRulesPromises);
    });

    it('requires a valid user session to retrieve a report', async () => {
      await initApp({ validatedSession: false });
      await requestReport().expect(HttpStatus.UNAUTHORIZED);
    });

    describe('With authenticated session', () => {
      beforeEach(() => initApp({ validatedSession: true }));

      it("cannot retrieve another reporter's report", async () => {
        const aReportNotOwned = await givenAReportNotOwned();
        await request(app.getHttpServer())
          .get(`/api/reports/${aReportNotOwned.id}`)
          .set('Cookie', 'sessionId=unused')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('retrieves a report', async () => {
        const response = await requestReport().expect(HttpStatus.OK);
        expect(response.body).toEqual<ReportRetrievalVM>({
          ...aReportRetrievedVM,
          rules: reportRulesSaved.reduce(
            (acc, [ruleGroup, reportRuleSnapshot]) => ({
              ...acc,
              [ruleGroup]: {
                ...acc[ruleGroup],
                [reportRuleSnapshot.ruleName]: {
                  id: reportRuleSnapshot.id,
                  validated: reportRuleSnapshot.validated,
                  preValidated: false,
                },
              },
            }),
            {} as ReportRetrievalVM['rules'],
          ),
        });
      });
    });

    const aReportRetrievedVM: ReportRetrievalVM =
      ReportRetrievalBuilder.fromDossierDeNominationTransparence(
        stubDossier,
        stubSession,
      ).buildVM();
    const aReport = ReportBuilder.fromRetrievalVM(aReportRetrievedVM)
      .with('dossierDeNominationId', stubDossier.id)
      .with('reporterId', reporterId)
      .with('sessionId', stubSession.id)
      .build();
    const requestReport = () =>
      request(app.getHttpServer())
        .get(`/api/reports/${aReportRetrievedVM.id}`)
        .set('Cookie', 'sessionId=unused');
  });

  const givenAReportNotOwned = async () => {
    const aReportNotOwned = ReportBuilder.forUpdate('uuid')
      .with('id', '10a4b056-dafa-4d28-93b5-e7dd51b9793d')
      .with('dossierDeNominationId', stubDossier.id)
      .with('sessionId', stubSession.id)
      .with('reporterId', '1c3f4001-8e08-4359-a68d-55fbf9811534')
      .build();
    await givenSomeReports(aReportNotOwned);
    return aReportNotOwned;
  };

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
