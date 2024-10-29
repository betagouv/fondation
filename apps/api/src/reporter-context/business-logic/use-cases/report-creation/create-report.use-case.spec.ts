import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reporter-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportRuleRepository } from 'src/reporter-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportRule } from '../../models/report-rules';
import { ReportToCreate, CreateReportUseCase } from './create-report.use-case';
import { CreateReportValidationError } from '../../errors/create-report-validation.error';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/repositories/fake-domain-event-repository';
import { ReportCreatedEvent } from '../../models/report-created.event';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/providers/deterministic-date-provider';

const nominationFileReportId = 'daa7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b';
const reportCreatedEventId = 'mms7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b';
const importedNominationFileId = 'imported-nomination-file-id';

describe('Create Report Use Case', () => {
  let nominationFileReportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let reportRuleRepository: FakeReportRuleRepository;
  let domainEventRepository: FakeDomainEventRepository;
  let datetimeProvider: DeterministicDateProvider;

  beforeEach(() => {
    nominationFileReportRepository = new FakeNominationFileReportRepository();
    transactionPerformer = new NullTransactionPerformer();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [nominationFileReportId];
    uuidGenerator.genUuids(21);
    reportRuleRepository = new FakeReportRuleRepository();
    domainEventRepository = new FakeDomainEventRepository();
    datetimeProvider = new DeterministicDateProvider();
    datetimeProvider.currentDate = new Date(2021, 8, 22);
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

    expectReports(
      new NominationFileReport(
        nominationFileReportId,
        datetimeProvider.currentDate,
        payload.biography,
        new DateOnly(2035, 8, 22),
        payload.name,
        payload.reporterName,
        new DateOnly(1962, 8, 22),
        payload.state,
        payload.formation,
        payload.transparency,
        payload.grade,
        payload.currentPosition,
        payload.targettedPosition,
        null,
        payload.rank,
      ),
    );
    expectRulesFromPayload(payload.rules);
  });

  it('informs about a created report', async () => {
    uuidGenerator.nextUuids = [nominationFileReportId, reportCreatedEventId];
    const payload = givenAReportToCreate();

    await createAReport(payload);

    expect(domainEventRepository).toHaveDomainEvents(
      new ReportCreatedEvent(
        reportCreatedEventId,
        nominationFileReportId,
        importedNominationFileId,
        datetimeProvider.currentDate,
      ),
    );
  });

  const givenAReportToCreate = (): ReportToCreate => ({
    name: 'Lucien Pierre',
    reporterName: 'LUC Loïc',
    formation: Magistrat.Formation.PARQUET,
    dueDate: {
      year: 2035,
      month: 8,
      day: 22,
    },
    state: NominationFile.ReportState.OPINION_RETURNED,
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
    rules: getAllRulesPreValidated(),
  });

  const createAReport = (payload: ReportToCreate) =>
    new CreateReportUseCase(
      nominationFileReportRepository,
      transactionPerformer,
      uuidGenerator,
      reportRuleRepository,
      domainEventRepository,
      datetimeProvider,
    ).execute(importedNominationFileId, payload);

  const expectReports = (...reports: NominationFileReport[]) => {
    expect(nominationFileReportRepository.reports).toEqual(
      reports.reduce(
        (acc, report) => ({
          ...acc,
          [report.id]: report,
        }),
        {},
      ),
    );
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
                null,
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
}): ReportToCreate['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(
    NominationFile.ManagementRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: true,
    }),
    {} as ReportToCreate['rules'][NominationFile.RuleGroup.MANAGEMENT],
  ),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(
    NominationFile.StatutoryRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]:
        options?.exceptRuleMinisterCabinet &&
        rule === NominationFile.StatutoryRule.MINISTER_CABINET
          ? false
          : true,
    }),
    {} as ReportToCreate['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(
    NominationFile.QualitativeRule,
  ).reduce(
    (acc, rule) => ({ ...acc, [rule]: true }),
    {} as ReportToCreate['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});
