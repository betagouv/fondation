import {
  NominationFile,
  ReportFileUsage,
  ReportListingVM,
  ReportListItemVM,
  ReportRetrievalVM,
  ReportUpdateDto,
} from "shared-models";
import { ReportApiModel } from "../../../core-logic/builders/ReportApiModel.builder";
import {
  EndpointResponse,
  ReportApiClient,
  UploadFileArg,
} from "../../../core-logic/gateways/ReportApi.client";

type ApiModel = ReportApiModel;

export class FakeReportApiClient implements ReportApiClient {
  static BASE_URI = "https://example.fr";

  // Readonly because Redux makes it immutable
  reports: Record<string, Readonly<ApiModel>> = {};
  currentReportId: string | null = null;

  deleteFilesError?: Error;
  uploadFilesError?: Error;

  addReports(...reports: ApiModel[]): void {
    for (const report of reports) {
      this.currentReportId = report.id;
      this.reports = {
        ...this.reports,
        [report.id]: report,
      };
    }
  }

  async updateReport(reportId: string, data: ReportUpdateDto): Promise<void> {
    const report = this.reports[reportId];
    if (!report) throw new Error("Report not found");
    this.VMGuard(report);

    this.reports[reportId] = {
      ...report,
      ...data,
    };
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    const [group, name] = ruleId.split("-") as [
      NominationFile.RuleGroup,
      NominationFile.RuleName,
    ];
    if (!this.currentReportId) throw new Error("No report id in fake client");
    const report = this.reports[this.currentReportId]!;
    this.VMGuard(report);

    const rule = (
      report.rules[group] as Record<
        NominationFile.RuleName,
        NominationFile.RuleValue
      >
    )[name];

    const newRules: NominationFile.Rules = {
      ...report.rules,
      [group]: {
        ...report.rules[group],
        [name]: {
          ...rule,
          validated,
        },
      },
    };

    this.reports[this.currentReportId] = {
      ...report,
      rules: newRules,
    };
  }

  async retrieveReport(id: string): Promise<ReportRetrievalVM> {
    const fullReport = this.reports[id];
    if (!fullReport) throw new Error("Report not found");
    this.VMGuard(fullReport);

    return fullReport;
  }

  async list(): Promise<ReportListingVM> {
    const reports = Object.values(this.reports);
    this.listGuard(reports);

    const reportsData = reports.map((report) => ({
      id: report.id,
      folderNumber: report.folderNumber,
      state: report.state,
      dueDate: report.dueDate,
      formation: report.formation,
      name: report.name,
      transparency: report.transparency,
      grade: report.grade,
      targettedPosition: report.targettedPosition,
      observersCount: report.observersCount,
    }));

    return {
      data: reportsData,
    };
  }

  async uploadFiles(
    reportId: string,
    files: UploadFileArg[],
    usage: ReportFileUsage,
  ): Promise<void> {
    if (this.uploadFilesError) throw this.uploadFilesError;

    const report = this.reports[reportId];
    if (!report) throw new Error("Report not found");
    this.VMGuard(report);

    const newAttachedFiles = files.map(({ file, fileId }) => ({
      usage,
      name: file.name,
      fileId,
    }));

    this.reports = {
      ...this.reports,
      [reportId]: {
        ...report,
        attachedFiles: [...(report.attachedFiles || []), ...newAttachedFiles],
      },
    };
  }

  async deleteFile(reportId: string, fileName: string): Promise<void> {
    const report = this.reports[reportId];
    if (!report) throw new Error("Report not found");
    this.VMGuard(report);

    if (report.attachedFiles)
      this.reports[reportId] = {
        ...report,
        attachedFiles: [
          ...report.attachedFiles.filter((file) => file.name !== fileName),
        ],
      };
  }

  async deleteFiles(
    reportId: string,
    fileNames: string[],
  ): EndpointResponse<"deleteFiles"> {
    if (this.deleteFilesError) throw this.deleteFilesError;

    const report = this.reports[reportId];
    if (!report) throw new Error("Report not found");
    this.VMGuard(report);

    this.reports[reportId] = {
      ...report,
      attachedFiles:
        report.attachedFiles?.filter(
          (file) => !fileNames.includes(file.name),
        ) || [],
    };
  }

  private VMGuard(
    report: ReportRetrievalVM | ReportListItemVM,
  ): asserts report is ReportRetrievalVM {
    if (!("comment" in report))
      throw new Error("Fake report should be a of type retrieval");
  }

  private listGuard(
    reports: (ReportRetrievalVM | ReportListItemVM)[],
  ): asserts reports is ReportListItemVM[] {
    for (const report of reports) {
      this.listItemsGuard(report);
    }
  }

  private listItemsGuard(
    report: ReportRetrievalVM | ReportListItemVM,
  ): asserts report is ReportListItemVM {
    if (!("observersCount" in report))
      throw new Error("Fake report should be a of type list item");
  }
}
