import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ReportListingVM } from 'src/reporter-context/business-logic/models/reports-listing-vm';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { ChangeRuleValidationStateDto } from '../nestia/change-rule-validation-state.dto';
import { tags } from 'typia';
import { RetrieveReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { ReportRetrievalVM } from 'src/reporter-context/business-logic/models/report-retrieval-vm';

@Controller('api/reports')
export class ReporterController {
  constructor(
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly retrieveReportUseCase: RetrieveReportUseCase,
    private readonly changeRuleValidationStateUseCase: ChangeRuleValidationStateUseCase,
  ) {}

  @TypedRoute.Get()
  async getReports(): Promise<ReportListingVM> {
    return this.listReportsUseCase.execute();
  }

  @TypedRoute.Get(':id')
  async retrieveReport(
    @TypedParam('id') id: string & tags.Format<'uuid'>,
  ): Promise<ReportRetrievalVM | null> {
    return this.retrieveReportUseCase.execute(id);
  }

  @TypedRoute.Put(':id')
  async updateReportRule(
    @TypedParam('id') id: string & tags.Format<'uuid'>,
    @TypedBody() dto: ChangeRuleValidationStateDto,
  ): Promise<void> {
    await this.changeRuleValidationStateUseCase.execute(
      id,
      dto.rule,
      dto.validated,
    );
  }
}
