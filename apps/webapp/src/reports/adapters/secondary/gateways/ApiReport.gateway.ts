import {
  Magistrat,
  NominationFile,
  ReportFileUsage,
  Transparency,
} from "shared-models";
import {
  ReportGateway,
  UpdateReportParams,
} from "../../../core-logic/gateways/Report.gateway";
import { ReportApiClient } from "../../../core-logic/gateways/ReportApi.client";
import { ReportListItem, ReportSM } from "../../../../store/appState";

export class ApiReportGateway implements ReportGateway {
  constructor(private readonly reportApiClient: ReportApiClient) {}

  async updateReport(
    reportId: string,
    data: UpdateReportParams,
  ): Promise<void> {
    const updateData = {
      comment: data.comment,
      state: data.state,
    };
    await this.reportApiClient.updateReport(reportId, updateData);
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    await this.reportApiClient.updateRule(ruleId, validated);
  }

  async retrieveReport(id: string): Promise<ReportSM | null> {
    const report = await this.reportApiClient.retrieveReport(id);

    if (!report) return null;
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
      attachedFiles: report.attachedFiles,
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
      transparency: item.transparency,
      grade: item.grade,
      targettedPosition: item.targettedPosition,
      observersCount: item.observersCount,
    }));
  }

  attachFile(
    reportId: string,
    file: File,
    usage: ReportFileUsage,
  ): Promise<void> {
    return this.reportApiClient.attachFile(reportId, file, usage);
  }

  generateFileUrl(reportId: string, fileName: string): Promise<string> {
    return this.reportApiClient.generateFileUrl(reportId, fileName);
  }

  generateFileUrlEndpoint(
    reportId: string,
    fileName: string,
  ): Promise<{ urlEndpoint: string; method: "GET" }> {
    return this.reportApiClient.generateFileUrlEndpoint(reportId, fileName);
  }

  async deleteAttachedFile(reportId: string, fileName: string): Promise<void> {
    await this.reportApiClient.deleteAttachedFile(reportId, fileName);
  }
}
