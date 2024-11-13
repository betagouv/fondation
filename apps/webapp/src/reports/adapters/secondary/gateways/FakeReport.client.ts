import { ReportUpdateDto } from "api-sdk/generated/structures/ReportUpdateDto";
import {
  NominationFile,
  ReportListingVM,
  ReportListItemVM,
  ReportRetrievalVM,
  RulesBuilder,
} from "shared-models";
import { ReportApiClient } from "../../../core-logic/gateways/ReportApi.client";

export type FakeReportFromApi = ReportRetrievalVM & ReportListItemVM;

export class FakeReportApiClient implements ReportApiClient {
  reports: Record<string, FakeReportFromApi> = {};
  currentReportId: string | null = null;
  currentRuleGroup: NominationFile.RuleGroup | null = null;
  currentRuleName: NominationFile.RuleName | null = null;

  addReport(
    report: Omit<FakeReportFromApi, "rules">,
    rule: {
      id: string;
      group: NominationFile.RuleGroup;
      name: NominationFile.RuleName;
      preValidated: boolean;
      validated: boolean;
      comment: string | null;
    },
  ): void {
    this.currentReportId = report.id;
    this.currentRuleGroup = rule.group;
    this.currentRuleName = rule.name;

    const allRulesPreValidated = new FakeReportRulesBuilder().build();
    this.reports[report.id] = {
      ...report,
      rules: allRulesPreValidated,
    };
    this.reports[report.id]!.rules = this.genRules(report.id, {
      id: rule.id,
      preValidated: rule.preValidated,
      validated: rule.validated,
      comment: rule.comment,
    });
  }

  async updateReport(reportId: string, data: ReportUpdateDto): Promise<void> {
    if (this.reports[reportId])
      this.reports[reportId] = {
        ...(this.reports[reportId] || {}),
        ...(data as FakeReportFromApi),
      };
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    if (!this.currentReportId)
      throw new Error("No nomination file id in fake client");
    const rule = (
      this.reports[this.currentReportId]!.rules[
        this.currentRuleGroup!
      ] as Record<NominationFile.RuleName, NominationFile.RuleValue>
    )[this.currentRuleName!] as NominationFile.RuleValue;

    this.reports[this.currentReportId]!.rules = this.genRules(
      this.currentReportId,
      {
        id: ruleId,
        validated,
        preValidated: rule.preValidated,
        comment: rule.comment,
      },
    );
  }

  async retrieveReport(id: string): Promise<ReportRetrievalVM | null> {
    const fullReport = this.reports[id];

    if (!fullReport) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reporterName, ...report } = fullReport;
    return report;
  }

  async list(): Promise<ReportListingVM> {
    const reports = Object.values(this.reports).map((report) => ({
      id: report.id,
      folderNumber: report.folderNumber,
      state: report.state,
      dueDate: report.dueDate,
      formation: report.formation,
      name: report.name,
      reporterName: report.reporterName,
      transparency: report.transparency,
      grade: report.grade,
      targettedPosition: report.targettedPosition,
      observersCount: report.observersCount,
    }));

    return {
      data: reports,
    };
  }

  private genRules(
    reportId: string,
    rule: {
      id: string;
      preValidated: boolean;
      validated: boolean;
      comment: string | null;
    },
  ): NominationFile.Rules {
    if (!this.currentReportId)
      throw new Error("No nomination file id in fake client");

    if (!this.currentRuleGroup || !this.currentRuleName) {
      throw new Error("No current rule group or name in fake client");
    }

    const report = this.reports[reportId];
    if (!report) throw new Error("No nomination file in fake client");

    return FakeReportRulesBuilder.fromCurrentRule(
      report.rules,
      this.currentRuleGroup,
      this.currentRuleName,
      rule,
    );
  }
}

class FakeReportRulesBuilder extends RulesBuilder {
  constructor() {
    super({
      id: "some-id",
      preValidated: true,
      validated: false,
      comment: null,
    });
  }

  static fromCurrentRule(
    rules: NominationFile.Rules<NominationFile.RuleValue>,
    currentRuleGroup: NominationFile.RuleGroup,
    currentRuleName: NominationFile.RuleName,
    rule: {
      id: string;
      preValidated: boolean;
      validated: boolean;
      comment: string | null;
    },
  ) {
    return {
      ...rules,
      [currentRuleGroup]: {
        ...rules[currentRuleGroup],
        [currentRuleName]: {
          id: rule.id,
          preValidated: rule.preValidated,
          validated: rule.validated,
          comment: rule.comment,
        },
      },
    };
  }
}
