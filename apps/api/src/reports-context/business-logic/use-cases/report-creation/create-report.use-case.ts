import {
  allRulesMapV2,
  Magistrat,
  NominationFile,
  RulesBuilder,
  Transparency,
} from 'shared-models';
import {
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';
import { ReporterTranslatorService } from 'src/reports-context/adapters/secondary/gateways/services/reporter-translator.service';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { CreateReportValidator } from '../../models/create-report.validator';
import { DomainRegistry } from '../../models/domain-registry';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportRule } from '../../models/report-rules';

export interface ReportToCreate {
  folderNumber: number | null;
  name: string;
  reporterName: string;
  formation: Magistrat.Formation;
  dueDate: DateOnlyJson | null;
  transparency: Transparency;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[] | null;
  rules: NominationFile.Rules<
    boolean,
    ManagementRule,
    StatutoryRule,
    QualitativeRule
  >;
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly reporterTranslatorService: ReporterTranslatorService,
  ) {}

  async execute(
    importedNominationFileId: string,
    createReportPayload: ReportToCreate,
  ): Promise<void> {
    new CreateReportValidator().validate(createReportPayload);

    const reporter = await this.reporterTranslatorService.reporterWithFullName(
      createReportPayload.reporterName,
    );

    return this.transactionPerformer.perform(async (trx) => {
      const report = NominationFileReport.createFromImport(
        importedNominationFileId,
        createReportPayload,
        reporter,
      );

      await this.reportRepository.save(report)(trx);

      const rulesRepositoryPromises = ImportedV1RulesToV2Builder.fromV1(
        createReportPayload.rules,
      ).buildRepositories(report.id, trx);

      await Promise.all(rulesRepositoryPromises);
    });
  }
}

class ImportedV1RulesToV2Builder extends RulesBuilder {
  buildRepositories(reportId: string, trx: unknown): Promise<void>[] {
    return Object.entries(this.build())
      .map(([ruleGroup, rules]) =>
        Object.entries(rules).map(([ruleName, rule]) =>
          DomainRegistry.reportRuleRepository().save(
            new ReportRule(
              rule.id,
              DomainRegistry.dateTimeProvider().now(),
              reportId,
              ruleGroup as NominationFile.RuleGroup,
              ruleName as NominationFile.RuleName,
              rule.preValidated,
              rule.validated,
            ),
          )(trx),
        ),
      )
      .flat();
  }

  static fromV1(rules: ReportToCreate['rules']): ImportedV1RulesToV2Builder {
    const uuidGenerator = DomainRegistry.uuidGenerator();

    const rulesV2 = new ImportedV1RulesToV2Builder(
      ({ ruleGroup, ruleName }) => {
        const preValidated = ImportedV1RulesToV2Builder.getPrevalidated(
          rules,
          ruleGroup,
          ruleName,
        );

        return {
          id: uuidGenerator.generate(),
          preValidated,
          validated: true,
        };
      },
      allRulesMapV2,
    );
    return rulesV2;
  }

  static getPrevalidated(
    rules: ReportToCreate['rules'],
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ): boolean {
    if (
      ruleName ===
        NominationFile.StatutoryRule
          .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS ||
      ruleName === NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS
    )
      return false;
    else if (
      ruleName ===
      NominationFile.ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
    ) {
      return (
        rules[ruleGroup][
          ruleName as keyof ReportToCreate['rules'][NominationFile.RuleGroup]
        ] ||
        rules[ruleGroup][
          'JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE' as keyof ReportToCreate['rules'][NominationFile.RuleGroup]
        ]
      );
    } else {
      const ruleValue =
        rules[ruleGroup][
          ruleName as keyof ReportToCreate['rules'][NominationFile.RuleGroup]
        ];
      return ruleValue;
    }
  }
}
