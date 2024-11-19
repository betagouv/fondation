import { TypedBody, TypedParam, TypedRoute } from '@nestia/core';
import { Controller, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportListingVM, ReportRetrievalVM } from 'shared-models';
import { AttachReportFileUseCase } from 'src/reports-context/business-logic/use-cases/report-attach-file/attach-report-file';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
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
    private readonly attachReportFileUseCase: AttachReportFileUseCase,
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

  @TypedRoute.Post(':id/files/upload-one')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @TypedParam('id') id: string & tags.Format<'uuid'>,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.attachReportFileUseCase.execute(
      id,
      file.originalname,
      file.buffer,
    );
  }

  @TypedRoute.Put('rules/:ruleId')
  async updateRule(
    @TypedParam('ruleId') ruleId: string & tags.Format<'uuid'>,
    @TypedBody() dto: ChangeRuleValidationStateDto,
  ): Promise<void> {
    await this.changeRuleValidationStateUseCase.execute(ruleId, dto.validated);
  }
}
