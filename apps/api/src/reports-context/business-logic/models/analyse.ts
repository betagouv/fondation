import { allRulesMapV2, NominationFile, RulesBuilder } from 'shared-models';
import { DomainRegistry } from './domain-registry';
import { ReportRule } from './report-rules';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';

export class Analyse {
  static créer(rapportId: string): TransactionableAsync {
    return async (trx) => {
      const rules = CreateRulesBuilder.fromV2().buildRepositories(
        rapportId,
        trx,
      );
      await Promise.all(rules);
    };
  }
}

export class CreateRulesBuilder extends RulesBuilder<
  Omit<NominationFile.RuleValue, 'preValidated'>
> {
  buildRepositories(reportId: string, trx: unknown): Promise<void>[] {
    const dateTimeProvider = DomainRegistry.dateTimeProvider();
    const reportRuleRepository = DomainRegistry.reportRuleRepository();

    return Object.entries(this.build())
      .map(([ruleGroup, rules]) =>
        Object.entries(rules).map(([ruleName, rule]) =>
          reportRuleRepository.save(
            new ReportRule(
              rule.id,
              dateTimeProvider.now(),
              reportId,
              ruleGroup as NominationFile.RuleGroup,
              ruleName as NominationFile.RuleName,
              rule.validated,
            ),
          )(trx),
        ),
      )
      .flat();
  }

  static fromV2(): CreateRulesBuilder {
    const uuidGenerator = DomainRegistry.uuidGenerator();

    const rulesV2 = new CreateRulesBuilder(
      () => ({
        id: uuidGenerator.generate(),
        validated: true,
      }),
      allRulesMapV2,
    );

    return rulesV2;
  }
}
