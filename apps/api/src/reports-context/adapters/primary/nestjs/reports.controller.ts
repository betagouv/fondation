import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportListingVM, ReportRetrievalVM } from 'shared-models';
import { AttachReportFileUseCase } from 'src/reports-context/business-logic/use-cases/report-attach-file/attach-report-file';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import {
  reportsControllerRoute,
  reportsEndpointRelativePaths,
  ReportsEndpoints,
  ReportUpdateDto,
} from 'shared-models';
import { ChangeRuleValidationStateDto } from './dto/report-update.dto';
import { GenerateReportFileUrlUseCase } from 'src/reports-context/business-logic/use-cases/report-file-url-generation/generate-report-file-url';

export type ReportsEndpoints = typeof ReportsEndpoints;

export type IReportController = {
  [K in keyof ReportsEndpoints]: (
    params: ReportsEndpoints[K]['Params'],
    body: K extends 'attachFile'
      ? Express.Multer.File
      : ReportsEndpoints[K]['Body'],
  ) => Promise<ReportsEndpoints[K]['Response']>;
};

@Controller(reportsControllerRoute)
export class ReportsController implements IReportController {
  constructor(
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly retrieveReportUseCase: RetrieveReportUseCase,
    private readonly changeRuleValidationStateUseCase: ChangeRuleValidationStateUseCase,
    private readonly updateReportUseCase: UpdateReportUseCase,
    private readonly attachReportFileUseCase: AttachReportFileUseCase,
    private readonly generateReportFileUrlUseCase: GenerateReportFileUrlUseCase,
  ) {}

  @Get(reportsEndpointRelativePaths.listReports)
  async listReports(): Promise<ReportListingVM> {
    return this.listReportsUseCase.execute();
  }

  @Get(reportsEndpointRelativePaths.retrieveReport)
  async retrieveReport(
    @Param() params: ReportsEndpoints['retrieveReport']['Params'],
  ): Promise<ReportRetrievalVM | null> {
    const { id } = params;
    return this.retrieveReportUseCase.execute(id);
  }

  @Put(reportsEndpointRelativePaths.updateReport)
  async updateReport(
    @Param() { id }: ReportsEndpoints['updateReport']['Params'],
    @Body() dto: ReportUpdateDto,
  ): Promise<void> {
    await this.updateReportUseCase.execute(id, dto);
  }

  @Put(reportsEndpointRelativePaths.updateRule)
  async updateRule(
    @Param() { ruleId }: ReportsEndpoints['updateRule']['Params'],
    @Body() dto: ChangeRuleValidationStateDto,
  ): Promise<void> {
    await this.changeRuleValidationStateUseCase.execute(ruleId, dto.validated);
  }

  @Post(reportsEndpointRelativePaths.attachFile)
  @UseInterceptors(FileInterceptor('file'))
  async attachFile(
    @Param() { id }: ReportsEndpoints['attachFile']['Params'],
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.attachReportFileUseCase.execute(
      id,
      file.originalname,
      file.buffer,
    );
  }

  @Get(reportsEndpointRelativePaths.generateFileUrl)
  async generateFileUrl(
    @Param()
    { reportId, fileName }: ReportsEndpoints['generateFileUrl']['Params'],
  ): Promise<string> {
    return this.generateReportFileUrlUseCase.execute(reportId, fileName);
  }
}
