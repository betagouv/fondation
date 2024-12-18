import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsContextRestContract } from 'shared-models';
import { AttachReportFileUseCase } from 'src/reports-context/business-logic/use-cases/report-attach-file/attach-report-file';
import { DeleteReportAttachedFileUseCase } from 'src/reports-context/business-logic/use-cases/report-file-deletion/delete-report-attached-file';
import { GenerateReportFileUrlUseCase } from 'src/reports-context/business-logic/use-cases/report-file-url-generation/generate-report-file-url';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import {
  ChangeRuleValidationStateDto,
  ReportUpdateDto,
} from './dto/report-update.dto';

type IReportController = IController<ReportsContextRestContract>;

const baseRoute: ReportsContextRestContract['basePath'] = 'api/reports';
const endpointsPaths: IControllerPaths<ReportsContextRestContract> = {
  retrieveReport: ':id',
  listReports: '',
  updateReport: ':id',
  updateRule: 'rules/:ruleId',
  attachFile: ':id/files/upload-one',
  generateFileUrl: ':reportId/files/:fileName',
  deleteAttachedFile: ':id/files/:fileName',
};

@Controller(baseRoute)
export class ReportsController implements IReportController {
  constructor(
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly retrieveReportUseCase: RetrieveReportUseCase,
    private readonly changeRuleValidationStateUseCase: ChangeRuleValidationStateUseCase,
    private readonly updateReportUseCase: UpdateReportUseCase,
    private readonly attachReportFileUseCase: AttachReportFileUseCase,
    private readonly generateReportFileUrlUseCase: GenerateReportFileUrlUseCase,
    private readonly deleteReportAttachedFileUseCase: DeleteReportAttachedFileUseCase,
  ) {}

  @Get(endpointsPaths.listReports)
  async listReports() {
    return this.listReportsUseCase.execute();
  }

  @Get(endpointsPaths.retrieveReport)
  async retrieveReport(
    @Param()
    params: ReportsContextRestContract['endpoints']['retrieveReport']['params'],
  ) {
    const { id } = params;
    return this.retrieveReportUseCase.execute(id);
  }

  @Put(endpointsPaths.updateReport)
  async updateReport(
    @Param()
    { id }: ReportsContextRestContract['endpoints']['updateReport']['params'],
    @Body() dto: ReportUpdateDto,
  ) {
    await this.updateReportUseCase.execute(id, dto);
  }

  @Put(endpointsPaths.updateRule)
  async updateRule(
    @Param()
    { ruleId }: ReportsContextRestContract['endpoints']['updateRule']['params'],
    @Body() dto: ChangeRuleValidationStateDto,
  ) {
    await this.changeRuleValidationStateUseCase.execute(ruleId, dto.validated);
  }

  @Post(endpointsPaths.attachFile)
  @UseInterceptors(FileInterceptor('file'))
  async attachFile(
    @Param()
    { id }: ReportsContextRestContract['endpoints']['attachFile']['params'],
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachReportFileUseCase.execute(
      id,
      file.originalname,
      file.buffer,
    );
  }

  @Get(endpointsPaths.generateFileUrl)
  async generateFileUrl(
    @Param()
    {
      reportId,
      fileName,
    }: ReportsContextRestContract['endpoints']['generateFileUrl']['params'],
  ) {
    return this.generateReportFileUrlUseCase.execute(reportId, fileName);
  }

  @Delete(endpointsPaths.deleteAttachedFile)
  async deleteAttachedFile(
    @Param()
    {
      id,
      fileName,
    }: ReportsContextRestContract['endpoints']['deleteAttachedFile']['params'],
  ) {
    return this.deleteReportAttachedFileUseCase.execute(id, fileName);
  }
}
