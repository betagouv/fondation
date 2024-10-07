import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ReportListingVM } from 'src/reporter-context/business-logic/models/ReportsListingVM';
import { ListReportsUseCase } from 'src/reporter-context/business-logic/use-cases/report-listing/listReports.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reporter-context/business-logic/use-cases/rule-validation-state-change/changeRuleValidationState.use-case';
import { ChangeRuleValidationStateDto } from '../nestia/ChangeRuleValidationState.dto';
import { tags } from 'typia';

@Controller('api/reports')
export class ReporterController {
  constructor(
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly changeRuleValidationStateUseCase: ChangeRuleValidationStateUseCase,
  ) {}

  @TypedRoute.Get()
  async getReports(): Promise<ReportListingVM> {
    return this.listReportsUseCase.execute();
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
