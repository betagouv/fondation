import {
  allRulesMapV2,
  Magistrat,
  NominationFile,
  Role,
  RulesBuilder,
  Transparency,
} from 'shared-models';
import { FakeNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-nomination-file-report.repository';
import { FakeReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/fake-report-rule.repository';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { StubUserService } from 'src/reports-context/adapters/secondary/gateways/services/stub-user.service';
import { DeterministicDateProvider } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-date-provider';
import { DeterministicUuidGenerator } from 'src/shared-kernel/adapters/secondary/gateways/providers/deterministic-uuid-generator';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { UnionToIntersection } from 'type-fest';
import { CreateReportValidationError } from '../../errors/create-report-validation.error';
import { BooleanReportRulesBuilder } from '../../models/boolean-report-rules.builder';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileReportSnapshot } from '../../models/nomination-file-report';
import { ReportRuleSnapshot } from '../../models/report-rules';
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
      role: Role.MEMBRE_COMMUN,
    };
    reporterTranslatorService = new ReporterTranslatorService(userService);

    DomainRegistry.setReportRuleRepository(reportRuleRepository);
    DomainRegistry.setUuidGenerator(uuidGenerator);
    DomainRegistry.setDateTimeProvider(datetimeProvider);
  });

  it("doesn't create any report if there's a rules count mismatch", () => {
    const reportToCreate = givenAReportWithRulesAlerts();
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

  it('retries the transaction if it fails', async () => {
    reportRepository.saveError = new Error('Save report failed');
    reportRepository.saveErrorCountLimit = 2;

    await createAReport(givenAReportWithRulesAlerts());

    expect(reportRepository.saveErrorCount).toBe(2);
  });

  it('shall not retry more than 4 times', async () => {
    reportRepository.saveError = new Error('Save report failed');
    reportRepository.saveErrorCountLimit = 6;

    await expect(createAReport(givenAReportWithRulesAlerts())).rejects.toThrow(
      'Save report failed',
    );
    expect(reportRepository.saveErrorCount).toBe(4);
  });

  it('creates a report', async () => {
    const payload = givenAReportWithRulesAlerts();

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
    expectRulesFromPayload(
      { defaultPreValidation: true },
      {
        [NominationFile.RuleGroup.MANAGEMENT]: {},
        [NominationFile.RuleGroup.STATUTORY]: {},
        [NominationFile.RuleGroup.QUALITATIVE]: {},
      },
    );
  });

  it('merges two rules', async () => {
    const payload = givenAReportWithRulesAlerts({
      rules: getAllRulesWithPreValidation(false, {
        exceptJudiciaryRoleAndJuridictionDegreeChange: true,
      }),
    });

    await createAReport(payload);

    expectRulesFromPayload(
      { defaultPreValidation: false },
      {
        [NominationFile.RuleGroup.MANAGEMENT]: {
          [NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]:
            {
              id: expect.any(String),
              preValidated: true,
              validated: true,
            },
        },
        [NominationFile.RuleGroup.STATUTORY]: {},
        [NominationFile.RuleGroup.QUALITATIVE]: {},
      },
    );
  });

  const givenAReportWithRulesAlerts = (
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
    rules: getAllRulesWithPreValidation(true),
    ...moreData,
  });

  const createAReport = (payload: ReportToCreate) =>
    new CreateReportUseCase(
      reportRepository,
      transactionPerformer,
      reporterTranslatorService,
    ).execute(importedNominationFileId, payload);

  const expectReports = (...reports: NominationFileReportSnapshot[]) => {
    expect(Object.values(reportRepository.reports)).toEqual(reports);
  };

  const expectRulesFromPayload = (
    { defaultPreValidation }: { defaultPreValidation: boolean },
    expectedRules: {
      [G in NominationFile.RuleGroup]: Partial<NominationFile.Rules[G]>;
    },
  ) => {
    expectRules(
      ...Object.values(
        new ReportRulesBuilder(({ ruleGroup, ruleName }) => {
          const value =
            ruleName ===
              NominationFile.StatutoryRule
                .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS ||
            ruleName === NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS
              ? {
                  id: expect.any(String),
                  preValidated: false,
                  validated: true,
                }
              : (
                  expectedRules[ruleGroup] as UnionToIntersection<
                    (typeof expectedRules)[NominationFile.RuleGroup]
                  >
                )[ruleName];

          return {
            createdAt: datetimeProvider.currentDate,
            reportId: nominationFileReportId,
            ruleGroup,
            ruleName,

            ...(value || {
              id: expect.any(String),
              preValidated: defaultPreValidation,
              validated: true,
            }),
          };
        }, allRulesMapV2).build(),
      )
        .map((r) => Object.values(r))
        .flat()
        .flat(),
    );
  };

  const expectRules = (...rules: ReportRuleSnapshot[]) => {
    expect(Object.values(reportRuleRepository.reportRules)).toEqual<
      ReportRuleSnapshot[]
    >(rules);
  };
});

export const getAllRulesWithPreValidation = (
  validation = true,
  options?: {
    exceptJudiciaryRoleAndJuridictionDegreeChange: true;
  },
): ReportToCreate['rules'] => {
  const builder = new BooleanReportRulesBuilder(validation);
  if (options?.exceptJudiciaryRoleAndJuridictionDegreeChange) {
    builder.with(
      'management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE',
      !validation,
    );
  }
  return builder.build();
};

class ReportRulesBuilder extends RulesBuilder<ReportRuleSnapshot> {}
