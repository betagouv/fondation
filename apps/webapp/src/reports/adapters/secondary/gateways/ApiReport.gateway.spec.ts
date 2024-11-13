import { NominationFile } from "shared-models";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportListItem, ReportSM } from "../../../store/appState";
import { ApiReportGateway } from "./ApiReport.gateway";
import { FakeReportApiClient } from "./FakeReport.client";

describe("Api Nomination File Gateway", () => {
  let reportApiClient: FakeReportApiClient;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReport(aReport, aRule);
  });

  it("lists a report", async () => {
    expect(await new ApiReportGateway(reportApiClient).list()).toEqual<
      ReportListItem[]
    >([
      {
        id: aReport.id,
        folderNumber: aReport.folderNumber,
        name: aReport.name,
        reporterName: aReport.reporterName,
        state: aReport.state,
        dueDate: aReport.dueDate,
        formation: aReport.formation,
        transparency: aReport.transparency,
        grade: aReport.grade,
        targettedPosition: aReport.targettedPosition,
        observersCount: aReport.observersCount,
      },
    ]);
  });

  it("retrieves a report", async () => {
    const rules = reportApiClient.reports[aReport.id]!.rules;

    expect(
      await new ApiReportGateway(reportApiClient).retrieveReport(aReport.id),
    ).toEqual<ReportSM>({
      id: aReport.id,
      folderNumber: aReport.folderNumber,
      name: aReport.name,
      biography: aReport.biography,
      dueDate: aReport.dueDate,
      birthDate: aReport.birthDate,
      state: aReport.state,
      formation: aReport.formation,
      transparency: aReport.transparency,
      grade: aReport.grade,
      currentPosition: aReport.currentPosition,
      targettedPosition: aReport.targettedPosition,
      comment: aReport.comment,
      rank: aReport.rank,
      observers: aReport.observers,
      rules: {
        ...rules,
        [aRule.group]: {
          ...rules[aRule.group],
          [aRule.name]: {
            id: aRule.id,
            preValidated: aRule.preValidated,
            validated: aRule.validated,
            comment: aRule.comment,
          },
        },
      },
    });
  });

  it("updates a rule", async () => {
    await new ApiReportGateway(reportApiClient).updateRule(
      aRule.id,
      !aRule.validated,
    );

    const ruleGroupEntry =
      reportApiClient.reports[aReport.id]!.rules[aRule.group];
    expect(
      (
        ruleGroupEntry as NominationFile.Rules[NominationFile.RuleGroup.MANAGEMENT]
      )[aRule.name],
    ).toEqual<NominationFile.RuleValue>({
      id: aRule.id,
      validated: !aRule.validated,
      preValidated: aRule.preValidated,
      comment: aRule.comment,
    });
  });
});

const aReport = {
  ...new ReportBuilder().buildRetrieveVM(),
  ...new ReportBuilder().buildListVM(),
};
const aRule = {
  id: "1",
  group: NominationFile.RuleGroup.MANAGEMENT,
  name: NominationFile.ManagementRule.TRANSFER_TIME,
  preValidated: true,
  validated: true,
  comment: "some rule comment",
};
