import {
  NominationFile,
  ReportFileUsage,
  ReportListingVM,
  ReportListItemVM,
  ReportRetrievalVM,
  ReportUpdateDto,
} from "shared-models";
import { ReportApiClient } from "../../../core-logic/gateways/ReportApi.client";
import { ReportApiModel } from "../../../core-logic/builders/ReportApiModel.builder";

export class FakeReportApiClient implements ReportApiClient {
  static BASE_URI = "https://example.fr";

  // Readonly because Redux makes it immutable
  reports: Record<string, Readonly<ReportApiModel>> = {};
  currentReportId: string | null = null;

  addReports(...reports: ReportApiModel[]): void {
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

  async attachFile(
    reportId: string,
    file: File,
    usage: ReportFileUsage,
  ): Promise<void> {
    const uri = `${FakeReportApiClient.BASE_URI}/${file.name}`;
    const report = this.reports[reportId];
    if (!report) throw new Error("Report not found");
    this.VMGuard(report);

    this.reports = {
      ...this.reports,
      [reportId]: {
        ...report,
        attachedFiles: [
          ...(report.attachedFiles || []),
          {
            usage,
            name: file.name,
            signedUrl: uri,
          },
        ],
      },
    };
  }

  async generateFileUrl(reportId: string, fileName: string): Promise<string> {
    const reportSignedUrl = this.reports[reportId]!.attachedFiles?.find(
      (file) => file.name === fileName,
    )?.signedUrl;
    const defaultUrl = `${FakeReportApiClient.BASE_URI}/${fileName}`;
    return reportSignedUrl ?? defaultUrl;
  }

  async deleteAttachedFile(reportId: string, fileName: string): Promise<void> {
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
