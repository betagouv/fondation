import { NominationFile, ReportFileUsage } from "shared-models";
import { ReportListItem, ReportSM } from "../../../../store/appState";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "./ApiReport.gateway";
import { FakeReportApiClient } from "./FakeReport.client";

describe("Api Report Gateway", () => {
  let reportApiClient: FakeReportApiClient;
  let apiReportGateway: ApiReportGateway;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    reportApiClient.addReports(aReportApiModel);
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
        dateTransparence: aReportListSM.dateTransparence,
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
      dateTransparence: aReportRetrievedSM.dateTransparence,
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
          },
        },
      },
      attachedFiles: aReportRetrievedSM.attachedFiles,
      contentScreenshots: aReportRetrievedSM.contentScreenshots,
      dureeDuPoste: aReportRetrievedSM.dureeDuPoste,
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
    });
  });

  describe("Attached Files", () => {
    const aFile = new File([""], "some-file.pdf");

    it("attaches a file", async () => {
      const file1 = new File(["content1"], "file1.pdf");
      const file1Id = "file1-id";

      await uploadFiles({ file: file1, fileId: file1Id });
      expectUploadedFiles({
        usage: ReportFileUsage.ATTACHMENT,
        name: file1.name,
        fileId: expect.any(String),
      });
    });

    it("uploads multiple files simultaneously", async () => {
      const file1 = new File(["content1"], "file1.pdf");
      const file2 = new File(["content2"], "file2.pdf");
      const file1Id = "file1-id";
      const file2Id = "file2-id";

      await uploadFiles(
        { file: file1, fileId: file1Id },
        { file: file2, fileId: file2Id },
      );

      expectUploadedFiles(
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: file1.name,
          fileId: file1Id,
        },
        {
          usage: ReportFileUsage.ATTACHMENT,
          name: file2.name,
          fileId: file2Id,
        },
      );
    });

    describe("When there is a file attached", () => {
      beforeEach(() => {
        reportApiClient.reports[aReportRetrievedSM.id]! = {
          ...reportApiClient.reports[aReportRetrievedSM.id]!,
          attachedFiles: [
            {
              usage: ReportFileUsage.ATTACHMENT,
              name: aFile.name,
              fileId: "some-file-id",
            },
          ],
        };
      });

      it("deletes an attached file", async () => {
        await apiReportGateway.deleteFile(aReportRetrievedSM.id, aFile.name);
        expectUploadedFiles();
      });

      it("deletes an attached file in batch", async () => {
        await apiReportGateway.deleteFiles(aReportRetrievedSM.id, [aFile.name]);
        expectUploadedFiles();
      });
    });

    const uploadFiles = async (...files: { file: File; fileId: string }[]) => {
      await apiReportGateway.uploadFiles(
        aReportRetrievedSM.id,
        files,
        ReportFileUsage.ATTACHMENT,
      );
    };

    const expectUploadedFiles = (
      ...files: NonNullable<ReportApiModel["attachedFiles"]>
    ) => {
      const attachedFiles =
        reportApiClient.reports[aReportRetrievedSM.id]!.attachedFiles;
      expect(attachedFiles).toHaveLength(files.length);
      expect(attachedFiles).toEqual(files);
    };
  });
});

const aRule = {
  id: `${NominationFile.RuleGroup.MANAGEMENT}-${NominationFile.ManagementRule.TRANSFER_TIME}`,
  group: NominationFile.RuleGroup.MANAGEMENT,
  name: NominationFile.ManagementRule.TRANSFER_TIME,
  preValidated: true,
  validated: true,
};

const aReportApiModel = new ReportApiModelBuilder()
  .withSomeRules()
  .with("rules.management.TRANSFER_TIME", {
    id: aRule.id,
    preValidated: aRule.preValidated,
    validated: aRule.validated,
  })
  .build();
const aReportRetrievedSM =
  ReportBuilder.fromApiModel(aReportApiModel).buildRetrieveSM();
const aReportListSM = ReportBuilder.fromApiModel(aReportApiModel).buildListSM();
