import { ReportListingVM, ReportRetrievalVM } from 'shared-models';
import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reporter-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import { tags } from 'typia';
import { ChangeRuleValidationStateDto } from '../nestia/change-rule-validation-state.dto';
import { ReportUpdateDto } from '../nestia/report-update.dto';

@Controller('api/reports')
export class ReporterController {
  constructor(
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly retrieveReportUseCase: RetrieveReportUseCase,
    private readonly changeRuleValidationStateUseCase: ChangeRuleValidationStateUseCase,
    private readonly updateReportUseCase: UpdateReportUseCase,
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
  async updateReport(
    @TypedParam('id') id: string & tags.Format<'uuid'>,
    @TypedBody() dto: ReportUpdateDto,
  ): Promise<void> {
    await this.updateReportUseCase.execute(id, dto);
  }

  @TypedRoute.Put('rules/:ruleId')
  async updateRule(
    @TypedParam('ruleId') ruleId: string & tags.Format<'uuid'>,
    @TypedBody() dto: ChangeRuleValidationStateDto,
  ): Promise<void> {
    await this.changeRuleValidationStateUseCase.execute(ruleId, dto.validated);
  }
}
