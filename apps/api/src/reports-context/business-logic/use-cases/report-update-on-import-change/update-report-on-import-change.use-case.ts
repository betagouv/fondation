import { NominationFile } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportRuleRepository } from '../../gateways/repositories/report-rule.repository';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import {
  ManagementRule,
  StatutoryRule,
  QualitativeRule,
} from 'src/data-administration-context/business-logic/models/rules';

export interface UpdateReportOnImportChangePayload {
  folderNumber?: number | null;
  observers?: string[];
  rules?: NominationFile.Rules<
    boolean,
    ManagementRule,
    StatutoryRule,
    QualitativeRule
  >;
}

export class UpdateReportOnImportChangeUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly reportRuleRepository: ReportRuleRepository,
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
        const rulesTuple = this.genRulesTuples(payload.rules);

        for (const report of reports) {
          for (const [ruleGroup, ruleName, preValidated] of rulesTuple) {
            const rule = await this.reportRuleRepository.byName(
              report.id,
              ruleGroup as NominationFile.RuleGroup,
              ruleName as NominationFile.RuleName,
            )(trx);
            if (rule && rule.preValidationChanged(preValidated)) {
              rule.preValidate(preValidated);
              await this.reportRuleRepository.save(rule)(trx);
            }
          }
        }
      }
    });
  }

  private genRulesTuples(
    rulesPayload: NonNullable<UpdateReportOnImportChangePayload['rules']>,
  ): (readonly [NominationFile.RuleGroup, NominationFile.RuleName, boolean])[] {
    return Object.entries(rulesPayload)
      .map(([ruleGroup, rulesPayload]) =>
        Object.entries(rulesPayload).map(
          ([ruleName, preValidated]) =>
            [
              ruleGroup as NominationFile.RuleGroup,
              ruleName as NominationFile.RuleName,
              preValidated,
            ] as const,
        ),
      )
      .flat();
  }
}
