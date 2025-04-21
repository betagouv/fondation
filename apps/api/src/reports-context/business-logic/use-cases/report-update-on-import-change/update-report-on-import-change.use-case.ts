import { allRulesMapV2, NominationFile, RulesBuilder } from 'shared-models';
import {
  ManagementRule,
  QualitativeRule,
  StatutoryRule,
} from 'src/data-administration-context/business-logic/models/rules';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { PartialDeep, UnionToIntersection } from 'type-fest';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { DomainRegistry } from '../../models/domain-registry';

type UpdatedRules = PartialDeep<
  NominationFile.Rules<boolean, ManagementRule, StatutoryRule, QualitativeRule>
>;

export interface UpdateReportOnImportChangePayload {
  folderNumber?: number | null;
  observers?: string[];
  rules?: UpdatedRules;
}

export class UpdateReportOnImportChangeUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(
    nominationFileId: string,
    payload: UpdateReportOnImportChangePayload,
  ): Promise<void> {
    return this.transactionPerformer.perform(async (trx) => {
      const reports =
        await this.reportRepository.byNominationFileId(nominationFileId)(trx);
      if (!reports?.length) throw new Error('Report not found');

      if (payload.folderNumber !== undefined) {
        for (const report of reports) {
          report.replaceFolderNumber(payload.folderNumber);
          await this.reportRepository.save(report)(trx);
        }
      }

      if (payload.observers) {
        for (const report of reports) {
          report.replaceObservers(payload.observers);
          await this.reportRepository.save(report)(trx);
        }
      }

      if (payload.rules) {
        for (const report of reports) {
          await Promise.all(
            ImportedV1RulesToV2Builder.fromV1(payload.rules).buildRepositories(
              report.id,
              trx,
            ),
          );
        }
      }
    });
  }
}

class ImportedV1RulesToV2Builder extends RulesBuilder<boolean | undefined> {
  buildRepositories(reportId: string, trx: unknown): Promise<void>[] {
    return Object.entries(this.build())
      .map(([ruleGroup, rules]) =>
        Object.entries(rules).map(async ([ruleName, preValidated]) => {
          const reportRuleRepository = DomainRegistry.reportRuleRepository();
          const rule = await reportRuleRepository.byName(
            reportId,
            ruleGroup as NominationFile.RuleGroup,
            ruleName as NominationFile.RuleName,
          )(trx);

          if (
            rule &&
            preValidated !== undefined &&
            rule.preValidationChanged(preValidated)
          ) {
            rule.preValidate(preValidated);
            await reportRuleRepository.save(rule)(trx);
          }
        }),
      )
      .flat();
  }

  static fromV1(
    rules: NonNullable<UpdateReportOnImportChangePayload['rules']>,
  ): ImportedV1RulesToV2Builder {
    const rulesV2 = new ImportedV1RulesToV2Builder(
      ({ ruleGroup, ruleName }) => {
        const preValidated = ImportedV1RulesToV2Builder.getPrevalidated(
          rules,
          ruleGroup,
          ruleName,
        );

        return preValidated;
      },
      allRulesMapV2,
    );
    return rulesV2;
  }

  static getPrevalidated(
    rules: NonNullable<UpdateReportOnImportChangePayload['rules']>,
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ): boolean | undefined {
    if (
      ruleName ===
        NominationFile.StatutoryRule
          .RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS ||
      ruleName === NominationFile.StatutoryRule.NOMINATION_CA_AVANT_4_ANS
    )
      return;

    const groupValues = rules[ruleGroup] as UnionToIntersection<
      (typeof rules)[NominationFile.RuleGroup]
    >;
    return groupValues?.[ruleName];
  }
}
