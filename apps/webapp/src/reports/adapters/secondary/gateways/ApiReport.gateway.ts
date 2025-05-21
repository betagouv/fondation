import {
  Magistrat,
  NominationFile,
  ReportFileUsage,
  Transparency,
} from "shared-models";
import { ReportListItem, ReportScreenshots } from "../../../../store/appState";
import {
  ReportGateway,
  UpdateReportParams,
} from "../../../core-logic/gateways/Report.gateway";
import {
  ReportApiClient,
  UploadFileArg,
} from "../../../core-logic/gateways/ReportApi.client";

export class ApiReportGateway implements ReportGateway {
  constructor(private readonly reportApiClient: ReportApiClient) {}

  async updateReport(
    reportId: string,
    data: UpdateReportParams,
  ): Promise<void> {
    await this.reportApiClient.updateReport(reportId, data);
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    await this.reportApiClient.updateRule(ruleId, validated);
  }

  async retrieveReport(id: string) {
    const report = await this.reportApiClient.retrieveReport(id);

    const initialContentScreenshots: ReportScreenshots = {
      files: [],
    };
    const contentScreenshots = report.attachedFiles
      ?.filter((file) => file.usage === ReportFileUsage.EMBEDDED_SCREENSHOT)
      .reduce(
        (acc, file) => ({
          files: [
            ...acc.files,
            {
              fileId: file.fileId,
              name: file.name,
              signedUrl: null,
            },
          ],
        }),
        initialContentScreenshots,
      );

    return {
      id: report.id,
      folderNumber: report.folderNumber,
      name: report.name,
      biography: report.biography,
      dueDate: report.dueDate,
      birthDate: report.birthDate,
      state: report.state as NominationFile.ReportState,
      formation: report.formation as Magistrat.Formation,
      transparency: report.transparency as Transparency,
      grade: report.grade as Magistrat.Grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: report.observers,
      rules: report.rules,
      attachedFiles:
        report.attachedFiles
          ?.filter((file) => file.usage === ReportFileUsage.ATTACHMENT)
          .map((file) => ({
            fileId: file.fileId,
            name: file.name,
            signedUrl: null,
          })) ?? null,
      contentScreenshots: contentScreenshots?.files.length
        ? contentScreenshots
        : null,
    };
  }

  async list(): Promise<ReportListItem[]> {
    const response = await this.reportApiClient.list();
    return response.data.map((item) => ({
      id: item.id,
      folderNumber: item.folderNumber,
      name: item.name,
      dueDate: item.dueDate,
      state: item.state,
      formation: item.formation,
      transparency: item.transparency as Transparency,
      grade: item.grade,
      targettedPosition: item.targettedPosition,
      observersCount: item.observersCount,
    }));
  }

  uploadFiles(
    reportId: string,
    files: UploadFileArg[],
    usage: ReportFileUsage,
  ) {
    return this.reportApiClient.uploadFiles(reportId, files, usage);
  }

  async deleteFile(reportId: string, fileName: string): Promise<void> {
    await this.reportApiClient.deleteFile(reportId, fileName);
  }

  async deleteFiles(reportId: string, fileNames: string[]): Promise<void> {
    await this.reportApiClient.deleteFiles(reportId, fileNames);
  }
}
