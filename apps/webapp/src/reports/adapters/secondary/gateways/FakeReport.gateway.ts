import {
  Magistrat,
  NominationFile,
  ReportListItemVM,
  ReportRetrievalVM,
  Transparency,
} from "shared-models";
import {
  ReportGateway,
  UpdateReportParams,
} from "../../../core-logic/gateways/Report.gateway";
import { ReportListItem, ReportSM } from "../../../store/appState";

export type FakeReportFromApi = ReportRetrievalVM | ReportListItemVM;

export class FakeReportGateway implements ReportGateway {
  static BASE_URI = "https://example.fr";

  // Readonly because Redux makes it immutable
  private reports: Record<string, Readonly<FakeReportFromApi>> = {};
  private lastReportId: string | null = null;

  async attachFile(reportId: string, file: File): Promise<void> {
    const signedUrl = `${FakeReportGateway.BASE_URI}/${file.name}`;
    const report = this.reports[reportId];
    if (!report) throw new Error("Nomination case not found");
    if (!("comment" in report))
      throw new Error("Fake report should be a of type retrieval");

    if (!report.attachedFiles)
      this.reports[reportId] = {
        ...report,
        attachedFiles: [
          ...(report.attachedFiles || []),
          {
            name: file.name,
            signedUrl,
          },
        ],
      };
  }

  generateFileUrl(reportId: string, fileName: string): Promise<string> {
    const report = this.reports[reportId];
    if (!report) throw new Error("Nomination case not found");
    if (!("comment" in report))
      throw new Error("Fake report should be a of type retrieval");

    const file = report.attachedFiles?.find((f) => f.name === fileName);
    if (!file) throw new Error("File not found");

    return Promise.resolve(file.signedUrl);
  }

  async list(): Promise<ReportListItem[]> {
    return (Object.values(this.reports) as ReportListItemVM[]).map(
      ({
        id,
        folderNumber,
        name,
        reporterName,
        dueDate,
        state,
        formation,
        transparency,
        grade,
        targettedPosition,
        observersCount,
      }) => ({
        id,
        folderNumber,
        name,
        reporterName,
        dueDate,
        state,
        formation,
        transparency,
        grade,
        targettedPosition,
        observersCount,
      }),
    );
  }

  async updateReport(
    reportId: string,
    data: UpdateReportParams,
  ): Promise<void> {
    if (this.reports[reportId])
      this.reports[reportId] = {
        ...this.reports[reportId],
        ...data,
      };
  }
  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    if (!this.lastReportId)
      throw new Error(
        "You should set the nomination id for the fake to do the update",
      );
    const report = this.reports[this.lastReportId];

    if (report) {
      if (!("comment" in report))
        throw new Error("Fake report should be a of type retrieval");

      Object.entries(report.rules).forEach(([ruleGroup, ruleEntry]) => {
        Object.entries(ruleEntry).forEach(([ruleName, rule]) => {
          if (rule.id === ruleId) {
            // It looks like Redux makes some nested attributes read-only,
            // so we need to create a new object
            this.reports[this.lastReportId!] = {
              ...report,
              rules: {
                ...report.rules,
                [ruleGroup]: {
                  ...report.rules[ruleGroup as NominationFile.RuleGroup],
                  [ruleName]: {
                    ...(
                      report.rules[
                        ruleGroup as NominationFile.RuleGroup
                      ] as Record<
                        NominationFile.RuleName,
                        NominationFile.RuleValue
                      >
                    )[ruleName as NominationFile.RuleName],
                    validated,
                  },
                },
              },
            };
          }
        });
      });
    }
  }

  async retrieveReport(id: string): Promise<ReportSM | null> {
    const report = this.reports[id];
    if (!report) throw new Error("Nomination case not found");
    if (!("comment" in report))
      throw new Error("Fake report should be a of type retrieval");

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

  addReport(aReport: FakeReportFromApi) {
    this.reports[aReport.id] = aReport;
    this.lastReportId = aReport.id;
  }
}
