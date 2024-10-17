import { Magistrat, NominationFile, Transparency } from '@/shared-models';
import { FakeNominationFileReportRepository } from 'src/reporter-context/adapters/secondary/repositories/fake-nomination-file-report.repository';
import { FakeReportRuleRepository } from 'src/reporter-context/adapters/secondary/repositories/fake-report-rule.repository';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/nullTransactionPerformer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportRule } from '../../models/report-rules';
import {
  CreateReportPayload,
  CreateReportUseCase,
} from './create-report.use-case';

const nominationFileReportId = 'daa7b3b0-0b3b-4b3b-8b3b-0b3b3b3b3b3b';

describe('Create Report Use Case', () => {
  let nominationFileReportRepository: FakeNominationFileReportRepository;
  let transactionPerformer: TransactionPerformer;
  let uuidGenerator: DeterministicUuidGenerator;
  let reportRuleRepository: FakeReportRuleRepository;

  beforeEach(() => {
    nominationFileReportRepository = new FakeNominationFileReportRepository();
    transactionPerformer = new NullTransactionPerformer();
    uuidGenerator = new DeterministicUuidGenerator();
    uuidGenerator.nextUuids = [nominationFileReportId];
    reportRuleRepository = new FakeReportRuleRepository();
  });

  it('creates a report', async () => {
    const payload = givenSomePayload();

    await new CreateReportUseCase(
      nominationFileReportRepository,
      transactionPerformer,
      uuidGenerator,
      reportRuleRepository,
    ).execute(payload);

    expectReports(
      new NominationFileReport(
        nominationFileReportId,
        payload.biography,
        new DateOnly(2035, 8, 22),
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
    expect(Object.values(reportRuleRepository.reportRules)).toEqual(
      Object.entries(payload.rules)
        .map(([ruleGroup, rules]) =>
          Object.entries(rules).map(
            ([rule, value]) =>
              new ReportRule(
                expect.any(String),
                nominationFileReportId,
                ruleGroup as NominationFile.RuleGroup,
                rule as NominationFile.RuleName,
                value,
                false,
                null,
              ),
          ),
        )
        .flat(),
    );
  });

  const givenSomePayload = (): CreateReportPayload => ({
    reporterName: 'Lucien Pierre',
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
});

export const getAllRulesPreValidated = (options?: {
  exceptRuleMinisterCabinet: true;
}): CreateReportPayload['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(
    NominationFile.ManagementRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: true,
    }),
    {} as CreateReportPayload['rules'][NominationFile.RuleGroup.MANAGEMENT],
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
    {} as CreateReportPayload['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(
    NominationFile.QualitativeRule,
  ).reduce(
    (acc, rule) => ({ ...acc, [rule]: true }),
    {} as CreateReportPayload['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});
