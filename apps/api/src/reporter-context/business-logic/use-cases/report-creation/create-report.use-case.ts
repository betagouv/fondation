import { Magistrat, NominationFile, Transparency } from 'shared-models';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import {
  DateOnly,
  DateOnlyJson,
} from 'src/shared-kernel/business-logic/models/date-only';
import { ReportRuleRepository } from '../../gateways/repositories/report-rule.repository';
import { ReportRepository } from '../../gateways/repositories/report.repository';
import { NominationFileReport } from '../../models/nomination-file-report';
import { ReportRule } from '../../models/report-rules';
import { CreateReportValidator } from '../../models/create-report.validator';

export interface CreateReportPayload {
  reporterName: string;
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
  ) {}
  async execute(createReportPayload: CreateReportPayload): Promise<void> {
    new CreateReportValidator().validate(createReportPayload);

    const reportId = this.uuidGenerator.generate();

    return this.transactionPerformer.perform(async (trx) => {
      await this.reportRepository.save(
        new NominationFileReport(
          reportId,
          createReportPayload.biography,
          createReportPayload.dueDate
            ? new DateOnly(
                createReportPayload.dueDate.year,
                createReportPayload.dueDate.month,
                createReportPayload.dueDate.day,
              )
            : null,
          createReportPayload.reporterName,
          new DateOnly(
            createReportPayload.birthDate.year,
            createReportPayload.birthDate.month,
            createReportPayload.birthDate.day,
          ),
          createReportPayload.state,
          createReportPayload.formation,
          createReportPayload.transparency,
          createReportPayload.grade,
          createReportPayload.currentPosition,
          createReportPayload.targettedPosition,
          null,
          createReportPayload.rank,
        ),
      )(trx);

      const rulesRepositoryPromises = Object.entries(createReportPayload.rules)
        .map(([ruleGroup, rules]) =>
          Object.entries(rules).map(([ruleName, preValidated]) =>
            this.reportRuleRepository.save(
              new ReportRule(
                this.uuidGenerator.generate(),
                reportId,
                ruleGroup as NominationFile.RuleGroup,
                ruleName as NominationFile.RuleName,
                preValidated,
                false,
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
