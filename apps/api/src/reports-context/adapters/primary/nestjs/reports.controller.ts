import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsContextRestContract } from 'shared-models';
import { ListReportByDnIdUseCase } from 'src/reports-context/business-logic/use-cases/list-report-by-dn-id/list-report-by-dn-id.use-case';
import { DeleteReportAttachedFileUseCase } from 'src/reports-context/business-logic/use-cases/report-file-deletion/delete-report-attached-file';
import { DeleteReportAttachedFilesUseCase } from 'src/reports-context/business-logic/use-cases/report-files-deletion/delete-report-attached-files';
import {
  ReportFile,
  UploadReportFilesUseCase,
} from 'src/reports-context/business-logic/use-cases/report-files-upload/upload-report-files';
import { ListReportsUseCase } from 'src/reports-context/business-logic/use-cases/report-listing/list-reports.use-case';
import { RetrieveReportUseCase } from 'src/reports-context/business-logic/use-cases/report-retrieval/retrieve-report.use-case';
import { UpdateReportUseCase } from 'src/reports-context/business-logic/use-cases/report-update/update-report.use-case';
import { ChangeRuleValidationStateUseCase } from 'src/reports-context/business-logic/use-cases/rule-validation-state-change/change-rule-validation-state.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { FilesInterceptor } from 'src/shared-kernel/adapters/primary/nestjs/interceptors/files.interceptor';
import { ChangeRuleValidationStateDto } from './dto/change-rule-validation-state.dto';
import { DeleteFilesQueryDto } from './dto/delete-files-query.dto';
import { ReportUpdateDto } from './dto/report-update.dto';
import { UploadFilesParamsDto } from './dto/upload-files-params.dto';
import { UploadFilesQueryParamsDto } from './dto/upload-files-query-params.dto';

type IReportController = IController<ReportsContextRestContract>;

const baseRoute: ReportsContextRestContract['basePath'] = 'api/reports';
const endpointsPaths: IControllerPaths<ReportsContextRestContract> = {
  retrieveReport: ':id',
  listReportByDnId: 'by-dn-id',
  listReports: 'transparences',
  updateReport: ':id',
  updateRule: 'rules/:ruleId',
  uploadFiles: ':id/files/upload-many',
  deleteFile: ':id/files/byName/:fileName',
  deleteFiles: ':id/files/byNames',
};

@Controller(baseRoute)
export class ReportsController implements IReportController {
  constructor(
    private readonly listReportByDnIdUseCase: ListReportByDnIdUseCase,
    private readonly listReportsUseCase: ListReportsUseCase,
    private readonly retrieveReportUseCase: RetrieveReportUseCase,
    private readonly changeRuleValidationStateUseCase: ChangeRuleValidationStateUseCase,
    private readonly updateReportUseCase: UpdateReportUseCase,
    private readonly deleteReportAttachedFileUseCase: DeleteReportAttachedFileUseCase,
    private readonly deleteReportAttachedFilesUseCase: DeleteReportAttachedFilesUseCase,
    private readonly uploadReportFilesUseCase: UploadReportFilesUseCase,
  ) {}

  @Get(endpointsPaths.listReports)
  async listReports(@Req() req: Request) {
    const userId = req.userId!;
    return this.listReportsUseCase.execute(userId);
  }

  @Get(endpointsPaths.listReportByDnId)
  async listReportByDnId(
    @Query()
    {
      dnId,
    }: ReportsContextRestContract['endpoints']['listReportByDnId']['params'],
  ) {
    return this.listReportByDnIdUseCase.execute(dnId);
  }

  @Get(endpointsPaths.retrieveReport)
  async retrieveReport(
    @Param()
    params: ReportsContextRestContract['endpoints']['retrieveReport']['params'],
    @Req() req: Request,
  ) {
    const { id } = params;
    const reporterId = req.userId!;

    const report = await this.retrieveReportUseCase.execute(id, reporterId);

    if (!report)
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    return report;
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

  @Post(endpointsPaths.uploadFiles)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param()
    { id }: UploadFilesParamsDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Query() { usage, fileIds }: UploadFilesQueryParamsDto,
    @Req() req: Request,
  ) {
    const reporterId = req.userId!;
    const reportFiles: ReportFile[] = files.map((file, index) => ({
      name: file.originalname,
      buffer: file.buffer,
      fileId: Array.isArray(fileIds) ? fileIds[index]! : fileIds,
    }));

    return this.uploadReportFilesUseCase.execute(
      id,
      reportFiles,
      reporterId,
      usage,
    );
  }

  @Delete(endpointsPaths.deleteFile)
  async deleteFile(
    @Param()
    {
      id,
      fileName,
    }: ReportsContextRestContract['endpoints']['deleteFile']['params'],
  ) {
    return this.deleteReportAttachedFileUseCase.execute(id, fileName);
  }

  @Delete(endpointsPaths.deleteFiles)
  async deleteFiles(
    @Param()
    { id }: ReportsContextRestContract['endpoints']['deleteFiles']['params'],
    @Query() query: DeleteFilesQueryDto,
  ) {
    const { fileNames } = query;
    return this.deleteReportAttachedFilesUseCase.execute(id, fileNames);
  }
}
