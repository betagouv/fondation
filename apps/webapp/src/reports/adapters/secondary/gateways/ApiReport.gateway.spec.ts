import { NominationFile } from "shared-models";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportListItem, ReportSM } from "../../../../store/appState";
import { ApiReportGateway } from "./ApiReport.gateway";
import { FakeReportApiClient } from "./FakeReport.client";
import { ReportApiModelBuilder } from "../../../core-logic/builders/ReportApiModel.builder";

describe("Api Report Gateway", () => {
  let reportApiClient: FakeReportApiClient;
  let apiReportGateway: ApiReportGateway;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReport(aReportApiModel);
    apiReportGateway = new ApiReportGateway(reportApiClient);
  });

  it("lists a report", async () => {
    expect(await apiReportGateway.list()).toEqual<ReportListItem[]>([
      {
        id: aReportListSM.id,
        folderNumber: aReportListSM.folderNumber,
        name: aReportListSM.name,
        state: aReportListSM.state,
        dueDate: aReportListSM.dueDate,
        formation: aReportListSM.formation,
        transparency: aReportListSM.transparency,
        grade: aReportListSM.grade,
        targettedPosition: aReportListSM.targettedPosition,
        observersCount: aReportListSM.observersCount,
      },
    ]);
  });

  it("retrieves a report", async () => {
    const rules = reportApiClient.reports[aReportRetrievedSM.id]!.rules!;

    expect(
      await apiReportGateway.retrieveReport(aReportRetrievedSM.id),
    ).toEqual<ReportSM>({
      id: aReportRetrievedSM.id,
      folderNumber: aReportRetrievedSM.folderNumber,
      name: aReportRetrievedSM.name,
      biography: aReportRetrievedSM.biography,
      dueDate: aReportRetrievedSM.dueDate,
      birthDate: aReportRetrievedSM.birthDate,
      state: aReportRetrievedSM.state,
      formation: aReportRetrievedSM.formation,
      transparency: aReportRetrievedSM.transparency,
      grade: aReportRetrievedSM.grade,
      currentPosition: aReportRetrievedSM.currentPosition,
      targettedPosition: aReportRetrievedSM.targettedPosition,
      comment: aReportRetrievedSM.comment,
      rank: aReportRetrievedSM.rank,
      observers: aReportRetrievedSM.observers,
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
      attachedFiles: aReportRetrievedSM.attachedFiles,
    });
  });

  it("updates a rule", async () => {
    await apiReportGateway.updateRule(aRule.id, !aRule.validated);

    const ruleGroupEntry =
      reportApiClient.reports[aReportRetrievedSM.id]!.rules![aRule.group];
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

  describe("Attached Files", () => {
    const aFile = new File([""], "some-file.pdf");

    it("attaches a file", async () => {
      await apiReportGateway.attachFile(aReportRetrievedSM.id, aFile);
      expect(
        reportApiClient.reports[aReportRetrievedSM.id]!.attachedFiles![0]!.name,
      ).toEqual(aFile.name);
    });

    describe("When there is a file attached", () => {
      beforeEach(() => {
        reportApiClient.reports[aReportRetrievedSM.id]! = {
          ...reportApiClient.reports[aReportRetrievedSM.id]!,
          attachedFiles: [{ name: aFile.name, signedUrl: "some-url" }],
        };
      });

      it("generates a file url", async () => {
        expect(
          await apiReportGateway.generateFileUrl(
            aReportRetrievedSM.id,
            aFile.name,
          ),
        ).toEqual("some-url");
      });

      it("deletes an attached file", async () => {
        await apiReportGateway.deleteAttachedFile(
          aReportRetrievedSM.id,
          aFile.name,
        );
        expect(
          reportApiClient.reports[aReportRetrievedSM.id]!.attachedFiles,
        ).toEqual([]);
      });
    });
  });
});

const aRule = {
  id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.TRANSFER_TIME}`,
  group: NominationFile.RuleGroup.MANAGEMENT,
  name: NominationFile.ManagementRule.TRANSFER_TIME,
  preValidated: true,
  validated: true,
  comment: "some rule comment",
};

const aReportApiModel = new ReportApiModelBuilder()
  .withSomeRules()
  .with("rules.management.TRANSFER_TIME", {
    id: aRule.id,
    preValidated: aRule.preValidated,
    validated: aRule.validated,
    comment: aRule.comment,
  })
  .build();
const aReportRetrievedSM =
  ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
const aReportListSM = ReportBuilder.fromApiModel(aReportApiModel).buildListSM();
