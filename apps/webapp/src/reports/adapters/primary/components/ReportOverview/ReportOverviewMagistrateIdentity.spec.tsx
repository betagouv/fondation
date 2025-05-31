import { render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { AllRulesMapV2, NominationFile } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { ReportOverview } from "./ReportOverview";
import { RulesLabelsMap } from "../../labels/rules-labels";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
} as const satisfies AllRulesMapV2;
const testRulesLabelsMap: RulesLabelsMap<typeof testRulesMap> = {
  [NominationFile.RuleGroup.MANAGEMENT]: {},
  [NominationFile.RuleGroup.STATUTORY]: {},
  [NominationFile.RuleGroup.QUALITATIVE]: {},
};

describe("Report Overview Component - Magistrate identity", () => {
  let store: ReduxStore;
  let reportApiClient: FakeReportApiClient;
  let reportApiModelBuilder: ReportApiModelBuilder;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      {},
      undefined,
      testRulesMap,
      testRulesLabelsMap,
      [],
      new Date(2020, 0, 1),
    );

    reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
  });

  it("shows magistrate identity section", async () => {
    const reportApiModel = reportApiModelBuilder
      .with("birthDate", {
        year: 1980,
        month: 1,
        day: 1,
      })
      .build();
    givenARenderedReport(reportApiModel);
    await expectMagistratIdentity();
  });

  it("shows magistrate identity without dureeDuPoste", async () => {
    const reportApiModel = reportApiModelBuilder
      .with("birthDate", {
        year: 1980,
        month: 1,
        day: 1,
      })
      .with("dureeDuPoste", null)
      .build();
    givenARenderedReport(reportApiModel);
    await expectMagistratIdentity(false);
  });

  const expectMagistratIdentity = async (
    isDureeDuPosteValid: boolean = true,
  ) => {
    const labels = ReportVM.magistratIdentityLabels;
    const section = within(
      await screen.findByRole("region", { name: "Identité du magistrat" }),
    );
    await section.findByText("John Doe");
    await section.findByText(`${labels.currentPosition} :`);
    await section.findByText(`PG TJ Paris - I`);
    if (isDureeDuPosteValid) {
      await section.findByText(`${labels.dureeDuPoste} :`);
      await section.findByText(`48 mois`);
    }
    await section.findByText(`${labels.rank} :`);
    await section.findByText(`(2 sur une liste de 3)`);
    await section.findByText(`${labels.birthDate} :`);
    await section.findByText(`01/01/1980 (40 ans)`);
    await section.findByText(`${labels.targettedPosition} :`);
    await section.findByText(`PG TJ Marseille`);
  };

  const givenARenderedReport = (report: ReportApiModel) => {
    reportApiClient.reports = {};
    reportApiClient.addReports(report);
    return renderReportId(report.id);
  };

  const renderReportId = (reportId: string) => {
    return render(
      <Provider store={store}>
        <ReportOverview id={reportId} />
      </Provider>,
    );
  };
});
