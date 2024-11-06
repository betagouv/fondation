import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';
import { ReportRuleRepository } from '../../gateways/repositories/report-rule.repository';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { CreateReportValidator } from '../../models/create-report.validator';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportRule } from '../../models/report-rules';

export interface ReportToCreate {
  name: string;
  reporterName: string | null;
  formation: Magistrat.Formation;
  dueDate: DateOnlyJson | null;
  state: NominationFile.ReportState;
  transparency: Transparency;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  birthDate: DateOnlyJson;
  biography: string | null;
  observers: string[] | null;
  rules: {
    [NominationFile.RuleGroup.MANAGEMENT]: {
      [key in NominationFile.ManagementRule]: boolean;
    };
    [NominationFile.RuleGroup.STATUTORY]: {
      [key in NominationFile.StatutoryRule]: boolean;
    };
    [NominationFile.RuleGroup.QUALITATIVE]: {
      [key in NominationFile.QualitativeRule]: boolean;
    };
  };
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly transactionPerformer: TransactionPerformer,
    private readonly uuidGenerator: UuidGenerator,
    private readonly reportRuleRepository: ReportRuleRepository,
    private readonly datetimeProvider: DateTimeProvider,
  ) {}
  async execute(
    importedNominationFileId: string,
    createReportPayload: ReportToCreate,
  ): Promise<void> {
    new CreateReportValidator().validate(createReportPayload);

    const reportId = this.uuidGenerator.generate();

    return this.transactionPerformer.perform(async (trx) => {
      const report = NominationFileReport.createFromImport(
        reportId,
        importedNominationFileId,
        createReportPayload,
        this.datetimeProvider.now(),
      );

      await this.reportRepository.save(report)(trx);

      const rulesRepositoryPromises = Object.entries(createReportPayload.rules)
        .map(([ruleGroup, rules]) =>
          Object.entries(rules).map(([ruleName, preValidated]) =>
            this.reportRuleRepository.save(
              new ReportRule(
                this.uuidGenerator.generate(),
                this.datetimeProvider.now(),
                reportId,
                ruleGroup as NominationFile.RuleGroup,
                ruleName as NominationFile.RuleName,
                preValidated,
                true,
                null,
              ),
            )(trx),
          ),
        )
        .flat();

      await Promise.all(rulesRepositoryPromises);
    });
  }
}
