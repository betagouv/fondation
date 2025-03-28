import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { CreateReportValidationError } from '../../errors/create-report-validation.error';
import { BooleanReportRulesBuilder } from '../../models/boolean-report-rules.builder';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportRule } from '../../models/report-rules';
import { CreateReportUseCase, ReportToCreate } from './create-report.use-case';

const nominationFileReportId = 'daa7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b';
const importedNominationFileId = 'imported-nomination-file-id';
const userId = 'reporter-id';

describe('Create Report Use Case', () => {
  let reportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let reportRuleRepository: FakeReportRuleRepository;
  let datetimeProvider: DeterministicDateProvider;
  let reporterTranslatorService: ReporterTranslatorService;

  beforeEach(() => {
    reportRepository = new FakeNominationFileReportRepository();
    transactionPerformer = new NullTransactionPerformer();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [nominationFileReportId];
    uuidGenerator.genUuids(21);
    reportRuleRepository = new FakeReportRuleRepository();
    datetimeProvider = new DeterministicDateProvider();
    datetimeProvider.currentDate = new Date(2021, 8, 22);
    const userService = new StubUserService();
    userService.user = {
      userId,
      firstName: 'Loïc',
      lastName: 'LUC',
    };
    reporterTranslatorService = new ReporterTranslatorService(userService);
  });

  it("doesn't create any report if there's a rules count mismatch", () => {
    const reportToCreate = givenAReportToCreate();
    reportToCreate.rules = {
      ...reportToCreate.rules,
      [NominationFile.RuleGroup.MANAGEMENT]: {
        [NominationFile.ManagementRule.TRANSFER_TIME]: true,
      } as ReportToCreate['rules'][NominationFile.RuleGroup.MANAGEMENT],
    };

    expect(createAReport(reportToCreate)).rejects.toThrow(
      CreateReportValidationError,
    );
    expectReports();
    expectRules();
  });

  it('creates a report', async () => {
    const payload = givenAReportToCreate();

    await createAReport(payload);

    expectReports({
      id: nominationFileReportId,
      nominationFileId: importedNominationFileId,
      createdAt: datetimeProvider.currentDate,
      version: 0,
      folderNumber: payload.folderNumber,
      biography: payload.biography,
      dueDate: new DateOnly(2035, 8, 22),
      name: payload.name,
      reporterId: userId,
      birthDate: new DateOnly(1962, 8, 22),
      state: NominationFile.ReportState.NEW,
      formation: payload.formation,
      transparency: payload.transparency,
      grade: payload.grade,
      currentPosition: payload.currentPosition,
      targettedPosition: payload.targettedPosition,
      comment: null,
      rank: payload.rank,
      observers: payload.observers,
      attachedFiles: null,
    });
    expectRulesFromPayload(payload.rules);
  });

  const givenAReportToCreate = (
    moreData?: Partial<ReportToCreate>,
  ): ReportToCreate => ({
    folderNumber: 1,
    name: 'Lucien Pierre',
    reporterName: 'LUC Loïc',
    formation: Magistrat.Formation.PARQUET,
    dueDate: {
      year: 2035,
      month: 8,
      day: 22,
    },
    transparency: Transparency.AUTOMNE_2024,
    grade: Magistrat.Grade.HH,
    currentPosition: 'Procureur de la République adjoint TJ  NIMES',
    targettedPosition: 'Avocat général CC  PARIS - HH',
    rank: '(2 sur une liste de 11)',
    birthDate: {
      year: 1962,
      month: 8,
      day: 22,
    },
    biography: '- blablablablabla',
    observers: ['New observer'],
    rules: getAllRulesPreValidated(),
    ...moreData,
  });

  const createAReport = (payload: ReportToCreate) =>
    new CreateReportUseCase(
      reportRepository,
      transactionPerformer,
      uuidGenerator,
      reportRuleRepository,
      datetimeProvider,
      reporterTranslatorService,
    ).execute(importedNominationFileId, payload);

  const expectReports = (...reports: NominationFileReportSnapshot[]) => {
    expect(Object.values(reportRepository.reports)).toEqual(reports);
  };

  const expectRulesFromPayload = (payloadRules: ReportToCreate['rules']) => {
    expectRules(
      ...Object.entries(payloadRules)
        .map(([ruleGroup, rules]) =>
          Object.entries(rules).map(
            ([rule, value]) =>
              new ReportRule(
                expect.any(String),
                expect.any(Date),
                nominationFileReportId,
                ruleGroup as NominationFile.RuleGroup,
                rule as NominationFile.RuleName,
                value,
                true,
              ),
          ),
        )
        .flat(),
    );
  };

  const expectRules = (...rules: ReportRule[]) => {
    expect(Object.values(reportRuleRepository.reportRules)).toEqual<
      ReportRule[]
    >(rules);
  };
});

export const getAllRulesPreValidated = (options?: {
  exceptRuleMinisterCabinet: true;
}): ReportToCreate['rules'] => {
  const builder = new BooleanReportRulesBuilder();
  if (options?.exceptRuleMinisterCabinet) {
    builder.with('statutory.MINISTER_CABINET', false);
  }
  return builder.build();
};
